import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Webhook received event:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Webhook received payment_intent.succeeded:', paymentIntent.id, paymentIntent.status);
        console.log('Payment intent metadata:', paymentIntent.metadata);
        
        if (paymentIntent.status === 'succeeded') {
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
            return NextResponse.json({ received: true, message: 'Gift already exists' });
          } else {
            console.log('No existing gift found, creating new one');
            // Create new gift without email requirements
            const giftAmount = paymentIntent.metadata?.giftAmount;
            const message = paymentIntent.metadata?.message;
            const animationPreset = paymentIntent.metadata?.animationPreset;
            
            // Log fee distribution
            console.log('Payment fee distribution:', {
              totalAmount: paymentIntent.amount,
              giftAmount: giftAmount,
              platformFee: paymentIntent.metadata?.platformFee,
              hasStripeConnect: false, // Simplified flow - no Stripe Connect
            });
            
            if (giftAmount) {
              try {
                console.log('Creating gift with metadata:', {
                  giftAmount,
                  message,
                  animationPreset
                });
                
                // Generate authentication code
                const authenticationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
                
                const gift = await prisma.gift.create({
                  data: {
                    amount: parseInt(giftAmount),
                    currency: paymentIntent.currency,
                    message: message || '',
                    senderEmail: 'noreply@monniegift.nl', // Placeholder for simplified flow
                    recipientEmail: 'pending@monniegift.nl', // Placeholder - will be collected during claim
                    authenticationCode,
                    animationPreset: animationPreset || 'confettiRealistic',
                    stripePaymentIntentId: paymentIntent.id,
                    // Store Stripe Connect information for payout tracking
                    stripeConnectAccountId: null, // No Stripe Connect in simplified flow
                    platformFeeAmount: parseInt(paymentIntent.metadata?.platformFee || '0'),
                    applicationFeeAmount: 0, // No application fee in simplified flow
                  },
                });

                console.log('Gift created successfully:', gift.id);
                console.log('Authentication code:', gift.authenticationCode);
                
              } catch (error) {
                console.error('Error creating gift:', error);
                console.error('Error details:', {
                  message: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            } else {
              console.log('Missing required metadata for gift creation:', {
                giftAmount: !!giftAmount
              });
            }
          }
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object;
        console.log('Transfer created (legacy system):', transfer.id, 'Amount:', transfer.amount);
        // Note: This is from the old manual transfer system
        // New system uses Stripe Connect application fees automatically
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
            console.error('Error updating gift after transfer reversal:', dbError);
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
        console.log('Account updated:', account.id);
        
        // Check if this is a user account
        try {
          const user = await prisma.user.findFirst({
            where: { stripeConnectAccountId: account.id },
          });
          
          if (user) {
            console.log(`User ${user.email} needs to complete:`, account.requirements?.currently_due || []);
          }
        } catch (dbError) {
          console.error('Error finding user for account update:', dbError);
        }
        
        // Check if account is fully onboarded and ready for transfers
        if (account.details_submitted && 
            (!account.requirements || !account.requirements.currently_due || account.requirements.currently_due.length === 0)) {
          
          console.log(`Account ${account.id} is fully onboarded, processing pending gifts`);
          
          try {
            // Find all pending gifts for this account
            const pendingGifts = await prisma.gift.findMany({
              where: {
                stripeConnectAccountId: account.id,
                isClaimed: false,
                claimedAt: null,
              },
            });

            console.log(`Found ${pendingGifts.length} pending gifts for account ${account.id}`);

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
                    type: 'gift_payout',
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
          } catch (dbError) {
            console.error('Error processing pending gifts:', dbError);
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = (event as any).data.object;
        break;
      }

      case 'outbound_transfer.created' as any: {
        const transfer = (event as any).data.object;
        console.log('Outbound transfer created:', transfer.id);
        break;
      }

      case 'outbound_transfer.succeeded' as any: {
        const transfer = (event as any).data.object;
        console.log('Outbound transfer succeeded:', transfer.id);
        break;
      }

      case 'outbound_transfer.failed' as any: {
        const transfer = (event as any).data.object;
        console.log('Outbound transfer failed:', transfer.id);
        break;
      }

      case 'transaction.created' as any: {
        const transaction = (event as any).data.object;
        console.log('Transaction created:', transaction.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}