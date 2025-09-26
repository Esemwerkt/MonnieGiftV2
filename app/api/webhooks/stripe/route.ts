import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';

// Force dynamic rendering
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
        const giftId = paymentIntent.metadata?.giftId;

        
        // Only send email if payment was successful
        if (giftId && paymentIntent.status === 'succeeded') {
          // Get gift details for email
          let gift;
          try {
            gift = await prisma.gift.findUnique({
              where: { id: giftId },
            });
          } catch (dbError) {
            // Continue without sending email if database is unavailable
            gift = null;
          }

          if (gift) {
            
            // Send email to recipient
            try {
              await sendGiftEmail({
                recipientEmail: gift.recipientEmail,
                giftId: gift.id,
                authenticationCode: gift.authenticationCode,
                amount: gift.amount,
                message: gift.message || undefined,
                senderEmail: gift.senderEmail,
              });
                } catch (emailError) {
                  // Email sending failed, continue
                }
          } else {
            
            // Fallback: Try to send email using payment intent metadata if database is unavailable
            const recipientEmail = paymentIntent.metadata?.recipientEmail;
            const senderEmail = paymentIntent.metadata?.senderEmail;
            const giftAmount = paymentIntent.metadata?.giftAmount;
            
            if (recipientEmail && senderEmail && giftAmount) {
              try {
                await sendGiftEmail({
                  recipientEmail,
                  giftId,
                  authenticationCode: 'TEMP123', // Temporary code since we can't get the real one
                  amount: parseInt(giftAmount),
                  message: paymentIntent.metadata?.message || undefined,
                  senderEmail,
                });
              } catch (fallbackError) {
                // Fallback email sending failed
              }
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
        
        // Update gift status if transfer was reversed
        if (transfer.metadata?.giftId) {
          try {
            await prisma.gift.update({
              where: { id: transfer.metadata.giftId },
              data: {
                isClaimed: false, // Reset claim status
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
        
        // Handle both v1 and v2 account formats
        const isV2Account = (account as any).configurations !== undefined;
        
        if (isV2Account) {
          // Accounts v2 format
          const merchantConfig = (account as any).configurations?.merchant;
        } else {
          // Accounts v1 format
        }
        
        // Check for additional KYC requirements (KYC-light monitoring)
        if (account.requirements && account.requirements.currently_due && account.requirements.currently_due.length > 0) {
          
          // Find user and notify about additional verification needed
          const user = await (prisma as any).user.findFirst({
            where: { stripeConnectAccountId: account.id },
          });
          
          if (user) {
            // TODO: Send notification email to user about additional verification
            // This could trigger an account update flow
          }
        }
        
        // Check if onboarding is complete (no requirements currently due)
        if (account.details_submitted && (!account.requirements || !account.requirements.currently_due || account.requirements.currently_due.length === 0)) {
          
          // Find user with this account ID
          const user = await (prisma as any).user.findFirst({
            where: { stripeConnectAccountId: account.id },
          });
          
          if (user) {
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
            
            
            // Process each pending gift
            for (const gift of pendingGifts) {
              try {
                // Create transfer for gift amount only (not total)
                const transfer = await stripe.transfers.create({
                  amount: gift.amount, // Only gift amount, not total
                  currency: gift.currency,
                  destination: account.id,
                  description: 'MonnieGift uitbetaling',
                  metadata: {
                    giftId: gift.id,
                    recipientEmail: user.email,
                  },
                });
                
                // Update gift as claimed
                await prisma.gift.update({
                  where: { id: gift.id },
                  data: {
                    isClaimed: true,
                    claimedAt: new Date(),
                    stripeTransferId: transfer.id,
                  },
                });
                
              } catch (transferError) {
              }
            }
          }
        }
        break;
      }

      case 'identity.verification_session.verified': {
        const verificationSession = event.data.object;
        
        // Find the associated account and update user status
        const accountId = verificationSession.metadata?.account_id;
        if (accountId) {
          try {
            // Update user verification status
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

      // ===== ACCOUNTS V2 EVENTS =====
      
      case 'account.created' as any: {
        const account = (event as any).data.object;
        break;
      }

      case 'account.deleted' as any: {
        const account = (event as any).data.object;
        // Handle account deletion if needed
        break;
      }

      case 'account_link.completed' as any: {
        const accountLink = (event as any).data.object;
        // Handle successful onboarding completion
        break;
      }

      // ===== IDENTITY VERIFICATION EVENTS =====
      
      case 'identity.verification_session.created': {
        const session = event.data.object;
        break;
      }

      case 'identity.verification_session.verified': {
        const session = event.data.object;
        
        // Update user verification status in database
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

      // ===== OUTBOUND TRANSFER V2 EVENTS =====
      
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

      // ===== TRANSACTION V2 EVENTS =====
      
      case 'transaction.created' as any: {
        const transaction = (event as any).data.object;
        break;
      }

      case 'transaction.updated' as any: {
        const transaction = (event as any).data.object;
        break;
      }

      // ===== ACCOUNTS V2 CONFIGURATION EVENTS =====
      
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

      // ===== SUBSCRIPTION EVENTS (Future Features) =====
      
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
