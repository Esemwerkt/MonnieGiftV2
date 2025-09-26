import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is working',
    method: 'GET',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    webhookSecretPresent: !!process.env.STRIPE_WEBHOOK_SECRET
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');


  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Webhook received payment_intent.succeeded:', paymentIntent.id, paymentIntent.status);
        
        if (paymentIntent.status === 'succeeded') {
          // Check if gift already exists for this payment intent
          let existingGift;
          try {
            existingGift = await prisma.gift.findFirst({
              where: { stripePaymentIntentId: paymentIntent.id },
            });
          } catch (dbError) {
            console.error('Database error finding existing gift:', dbError);
            existingGift = null;
          }

          if (existingGift) {
            console.log('Gift already exists:', existingGift.id);
            // Gift already exists, just send email
            try {
              await sendGiftEmail({
                recipientEmail: existingGift.recipientEmail,
                giftId: existingGift.id,
                authenticationCode: existingGift.authenticationCode,
                amount: existingGift.amount,
                message: existingGift.message || undefined,
                senderEmail: existingGift.senderEmail,
              });
              console.log('Email sent for existing gift');
            } catch (emailError) {
              console.error('Email sending error:', emailError);
            }
          } else {
            console.log('No existing gift found, creating new one');
            // Create new gift
            const recipientEmail = paymentIntent.metadata?.recipientEmail;
            const senderEmail = paymentIntent.metadata?.senderEmail;
            const giftAmount = paymentIntent.metadata?.giftAmount;
            const message = paymentIntent.metadata?.message;
            const animationPreset = paymentIntent.metadata?.animationPreset;
            
            if (recipientEmail && senderEmail && giftAmount) {
              try {
                console.log('Creating gift with metadata:', {
                  recipientEmail,
                  senderEmail,
                  giftAmount,
                  message,
                  animationPreset,
                  paymentIntentId: paymentIntent.id
                });
                
                // Generate authentication code
                const authenticationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
                
                const gift = await prisma.gift.create({
                  data: {
                    amount: parseInt(giftAmount),
                    currency: paymentIntent.currency,
                    message: message || '',
                    senderEmail,
                    recipientEmail,
                    authenticationCode,
                    animationPreset: animationPreset || 'confettiRealistic',
                    stripePaymentIntentId: paymentIntent.id,
                  },
                });

                console.log('Gift created successfully:', gift.id);

                // Send email
                await sendGiftEmail({
                  recipientEmail,
                  giftId: gift.id,
                  authenticationCode: gift.authenticationCode,
                  amount: gift.amount,
                  message: gift.message || undefined,
                  senderEmail,
                });
                
                console.log('Email sent for new gift');
              } catch (error) {
                console.error('Error creating gift or sending email:', error);
              }
            } else {
              console.log('Missing required metadata for gift creation:', {
                recipientEmail: !!recipientEmail,
                senderEmail: !!senderEmail,
                giftAmount: !!giftAmount
              });
            }
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const giftId = session.metadata?.giftId;

        if (giftId) {
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object;
        break;
      }

      case 'transfer.reversed': {
        const transfer = event.data.object;
        
        if (transfer.metadata?.giftId) {
          try {
            await prisma.gift.update({
              where: { id: transfer.metadata.giftId },
              data: {
                isClaimed: false, 
                claimedAt: null,
                stripeTransferId: `reversed_${transfer.id}`,
              },
            });
          } catch (dbError) {
          }
        }
        break;
      }

      case 'transfer.updated': {
        const transfer = event.data.object;
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        
        // Check if account has requirements that need to be fulfilled
        if (account.requirements && account.requirements.currently_due && account.requirements.currently_due.length > 0) {
          console.log(`Account ${account.id} has pending requirements:`, account.requirements.currently_due);
          
          // Find user and log requirements
          const user = await (prisma as any).user.findFirst({
            where: { stripeConnectAccountId: account.id },
          });
          
          if (user) {
            console.log(`User ${user.email} needs to complete:`, account.requirements.currently_due);
          }
        }
        
        // Check if account is fully onboarded and ready for transfers
        if (account.details_submitted && 
            (!account.requirements || !account.requirements.currently_due || account.requirements.currently_due.length === 0)) {
          
          console.log(`Account ${account.id} is fully onboarded, processing pending gifts`);
          
          const user = await (prisma as any).user.findFirst({
            where: { stripeConnectAccountId: account.id },
          });
          
          if (user) {
            // Mark user as verified
            await (prisma as any).user.update({
              where: { id: user.id },
              data: { 
                isVerified: true,
                identityVerifiedAt: new Date(),
              },
            });

            // Find pending gifts for this user
            const pendingGifts = await prisma.gift.findMany({
              where: {
                recipientEmail: user.email,
                stripeTransferId: {
                  startsWith: 'pending_',
                },
                isClaimed: false,
              },
            });
            
            console.log(`Found ${pendingGifts.length} pending gifts for ${user.email}`);
            
            // Process each pending gift
            for (const gift of pendingGifts) {
              try {
                console.log(`Processing gift ${gift.id} for ${gift.amount} cents`);
                
                const transfer = await stripe.transfers.create({
                  amount: gift.amount, 
                  currency: gift.currency,
                  destination: account.id,
                  description: 'MonnieGift uitbetaling',
                  metadata: {
                    giftId: gift.id,
                    recipientEmail: user.email,
                  },
                });
                
                await prisma.gift.update({
                  where: { id: gift.id },
                  data: {
                    isClaimed: true,
                    claimedAt: new Date(),
                    stripeTransferId: transfer.id,
                  },
                });
                
                console.log(`Successfully transferred gift ${gift.id} with transfer ${transfer.id}`);
                
              } catch (transferError) {
                console.error(`Failed to transfer gift ${gift.id}:`, transferError);
              }
            }
          }
        }
        break;
      }

      case 'identity.verification_session.verified': {
        const verificationSession = event.data.object;
        
        const accountId = verificationSession.metadata?.account_id;
        if (accountId) {
          try {
            await (prisma as any).user.update({
              where: { stripeConnectAccountId: accountId },
              data: {
                isVerified: true,
                identityVerifiedAt: new Date(),
              },
            });
          } catch (dbError) {
          }
        }
        break;
      }

      case 'identity.verification_session.requires_input': {
        const verificationSession = event.data.object;
        break;
      }

      case 'identity.verification_session.canceled': {
        const verificationSession = event.data.object;
        break;
      }

      
      case 'account.created' as any: {
        const account = (event as any).data.object;
        break;
      }

      case 'account.deleted' as any: {
        const account = (event as any).data.object;
        break;
      }

      case 'account_link.completed' as any: {
        const accountLink = (event as any).data.object;
        break;
      }

      
      case 'identity.verification_session.created': {
        const session = event.data.object;
        break;
      }

      case 'identity.verification_session.verified': {
        const session = event.data.object;
        
        if (session.metadata?.account_id) {
          try {
            await (prisma as any).user.update({
              where: { stripeConnectAccountId: session.metadata.account_id },
              data: { 
                isVerified: true,
                identityVerifiedAt: new Date()
              }
            });
          } catch (error) {
          }
        }
        break;
      }

      case 'identity.verification_session.requires_input': {
        const session = event.data.object;
        break;
      }

      case 'identity.verification_session.canceled': {
        const session = event.data.object;
        break;
      }

      case 'identity.verification_session.expired' as any: {
        const session = (event as any).data.object;
        break;
      }

      
      case 'outbound_transfer.created' as any: {
        const transfer = (event as any).data.object;
        break;
      }

      case 'outbound_transfer.succeeded' as any: {
        const transfer = (event as any).data.object;
        break;
      }

      case 'outbound_transfer.failed' as any: {
        const transfer = (event as any).data.object;
        break;
      }

      
      case 'transaction.created' as any: {
        const transaction = (event as any).data.object;
        break;
      }

      case 'transaction.updated' as any: {
        const transaction = (event as any).data.object;
        break;
      }

      
      case 'account.merchant_configuration.updated' as any: {
        const account = (event as any).data.object;
        break;
      }

      case 'account.customer_configuration.updated' as any: {
        const account = (event as any).data.object;
        break;
      }

      case 'account.requirements.updated' as any: {
        const account = (event as any).data.object;
        break;
      }

      case 'account.identity.updated' as any: {
        const account = (event as any).data.object;
        break;
      }

      
      case 'invoice.created': {
        const invoice = event.data.object;
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        break;
      }

      case 'customer.entitlements.updated' as any: {
        const customer = (event as any).data.object;
        break;
      }

      case 'subscription_schedule.created': {
        const schedule = event.data.object;
        break;
      }

      case 'subscription_schedule.completed': {
        const schedule = event.data.object;
        break;
      }

      case 'subscription_schedule.canceled': {
        const schedule = event.data.object;
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
