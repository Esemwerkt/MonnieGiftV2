import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendGiftEmail } from '@/lib/email';
import { generateUniqueVerificationCode, hashAuthenticationCode } from '@/lib/auth';
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

  console.log('=== WEBHOOK EVENT RECEIVED ===');
  console.log('Event type:', event.type);
  console.log('Event ID:', event.id);
  console.log('Event created:', event.created);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('=== WEBHOOK: payment_intent.succeeded ===');
        console.log('Payment Intent ID:', paymentIntent.id);
        console.log('Payment status:', paymentIntent.status);
        console.log('Payment amount:', paymentIntent.amount);
        console.log('Payment metadata:', paymentIntent.metadata);
        
        if (paymentIntent.status === 'succeeded') {
          let existingGift;
          try {
            const { data: gift } = await supabaseAdmin
              .from('gifts')
              .select('*')
              .eq('stripePaymentIntentId', paymentIntent.id)
              .single();
            existingGift = gift;
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
              console.log('✅ Gift amount found, proceeding with gift creation');
              try {
                console.log('Creating gift with metadata:', {
                  giftAmount,
                  message,
                  animationPreset
                });
                
                // Generate plain text code for display/email
                const plainTextCode = await generateUniqueVerificationCode(supabaseAdmin);
                console.log('Generated authentication code:', plainTextCode, 'Length:', plainTextCode.length);
                
                // Verify code length (should be 8 characters)
                if (plainTextCode.length !== 8) {
                  console.error('WARNING: Authentication code length is not 8! Code:', plainTextCode, 'Length:', plainTextCode.length);
                }
                
                // Hash the code for secure storage
                const hashedCode = await hashAuthenticationCode(plainTextCode);
                
                const now = new Date().toISOString();
                const { data: gift, error: giftError } = await supabaseAdmin
                  .from('gifts')
                  .insert([{
                    id: crypto.randomUUID(),
                    amount: parseInt(giftAmount),
                    currency: paymentIntent.currency,
                    message: message || '',
                    senderEmail: paymentIntent.metadata?.senderEmail || 'unknown@example.com',
                    recipientEmail: paymentIntent.metadata?.recipientEmail || 'pending@example.com',
                    authenticationCode: hashedCode, // Store hashed version
                    stripePaymentIntentId: paymentIntent.id,
                    platformFee: parseInt(paymentIntent.metadata?.platformFee || '0'),
                    animationPreset: animationPreset || 'confettiRealistic',
                    platformFeeAmount: parseInt(paymentIntent.metadata?.platformFee || '0'),
                    applicationFeeAmount: 0,
                    stripeConnectAccountId: null,
                    createdAt: now,
                    updatedAt: now,
                  }])
                  .select()
                  .single();

                if (giftError) {
                  throw giftError;
                }

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
            await supabaseAdmin
              .from('gifts')
              .update({
                isClaimed: false, 
                claimedAt: null,
                stripeTransferId: `reversed_${transfer.id}`,
              })
              .eq('id', transfer.metadata.giftId);
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
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('stripeConnectAccountId', account.id)
            .single();
          
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
            const { data: pendingGifts } = await supabaseAdmin
              .from('gifts')
              .select('*')
              .eq('stripeConnectAccountId', account.id)
              .eq('isClaimed', false)
              .is('claimedAt', null);

            console.log(`Found ${pendingGifts?.length || 0} pending gifts for account ${account.id}`);

            // Process each pending gift
            for (const gift of pendingGifts || []) {
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

                await supabaseAdmin
                  .from('gifts')
                  .update({
                    isClaimed: true,
                    claimedAt: new Date().toISOString(),
                    stripeTransferId: transfer.id,
                  })
                  .eq('id', gift.id);
                
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