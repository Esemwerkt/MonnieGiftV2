import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Signature present:', !!signature);
  console.log('Webhook secret present:', !!process.env.STRIPE_WEBHOOK_SECRET);
  console.log('Body length:', body.length);
  console.log('Raw body preview:', body.substring(0, 200));

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing signature or webhook secret');
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
    console.error('Webhook signature verification failed:', err);
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

        console.log('PaymentIntent succeeded for gift:', giftId);
        console.log('Payment status:', paymentIntent.status);
        console.log('Amount:', paymentIntent.amount);
        
        // Only send email if payment was successful
        if (giftId && paymentIntent.status === 'succeeded') {
          // Get gift details for email
          let gift;
          try {
            gift = await prisma.gift.findUnique({
              where: { id: giftId },
            });
          } catch (dbError) {
            console.error('❌ Database error in webhook:', dbError);
            console.error('Database error details:', {
              giftId,
              error: dbError instanceof Error ? dbError.message : String(dbError)
            });
            // Continue without sending email if database is unavailable
            gift = null;
          }

          if (gift) {
            console.log('Found gift for email sending:', {
              giftId: gift.id,
              recipientEmail: gift.recipientEmail,
              amount: gift.amount,
              authenticationCode: gift.authenticationCode
            });
            
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
              console.log('✅ Email sent successfully after payment!');
            } catch (emailError) {
              console.error('❌ Failed to send email after payment:', emailError);
              console.error('Email error details:', {
                giftId: gift.id,
                recipientEmail: gift.recipientEmail,
                error: emailError instanceof Error ? emailError.message : String(emailError)
              });
            }
          } else {
            console.error('❌ Gift not found for ID:', giftId);
            
            // Fallback: Try to send email using payment intent metadata if database is unavailable
            const recipientEmail = paymentIntent.metadata?.recipientEmail;
            const senderEmail = paymentIntent.metadata?.senderEmail;
            const giftAmount = paymentIntent.metadata?.giftAmount;
            
            if (recipientEmail && senderEmail && giftAmount) {
              console.log('🔄 Attempting fallback email using payment metadata:', {
                recipientEmail,
                senderEmail,
                giftAmount,
                giftId
              });
              
              try {
                await sendGiftEmail({
                  recipientEmail,
                  giftId,
                  authenticationCode: 'TEMP123', // Temporary code since we can't get the real one
                  amount: parseInt(giftAmount),
                  message: paymentIntent.metadata?.message || undefined,
                  senderEmail,
                });
                console.log('✅ Fallback email sent successfully!');
              } catch (fallbackError) {
                console.error('❌ Fallback email also failed:', fallbackError);
              }
            } else {
              console.error('❌ Cannot send fallback email - missing metadata:', {
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
          console.log(`Checkout session expired for gift ${giftId}`);
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object;
        console.log(`Transfer created: ${transfer.id}`);
        console.log(`Amount: ${transfer.amount} ${transfer.currency}`);
        console.log(`Destination: ${transfer.destination}`);
        break;
      }

      case 'transfer.reversed': {
        const transfer = event.data.object;
        console.log(`Transfer reversed: ${transfer.id}`);
        console.log(`Amount: ${transfer.amount} ${transfer.currency}`);
        console.log(`Destination: ${transfer.destination}`);
        
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
            console.log(`Updated gift ${transfer.metadata.giftId} - transfer reversed`);
          } catch (dbError) {
            console.error('Failed to update gift after transfer reversal:', dbError);
          }
        }
        break;
      }

      case 'transfer.updated': {
        const transfer = event.data.object;
        console.log(`Transfer updated: ${transfer.id}`);
        console.log(`Amount: ${transfer.amount} ${transfer.currency}`);
        console.log(`Destination: ${transfer.destination}`);
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        console.log(`Connect account updated: ${account.id}`);
        
        // Handle both v1 and v2 account formats
        const isV2Account = (account as any).configurations !== undefined;
        
        if (isV2Account) {
          // Accounts v2 format
          const merchantConfig = (account as any).configurations?.merchant;
          console.log(`v2 Account - Charges enabled: ${merchantConfig?.charges_enabled}`);
          console.log(`v2 Account - Payouts enabled: ${merchantConfig?.payouts_enabled}`);
          console.log(`v2 Account - Details submitted: ${merchantConfig?.details_submitted}`);
        } else {
          // Accounts v1 format
          console.log(`v1 Account - Charges enabled: ${account.charges_enabled}`);
          console.log(`v1 Account - Payouts enabled: ${account.payouts_enabled}`);
          console.log(`v1 Account - Details submitted: ${account.details_submitted}`);
        }
        
        // Check for additional KYC requirements (KYC-light monitoring)
        if (account.requirements && account.requirements.currently_due && account.requirements.currently_due.length > 0) {
          console.log(`⚠️ Additional KYC requirements needed for account ${account.id}:`, account.requirements.currently_due);
          console.log(`Eventually due:`, account.requirements.eventually_due);
          console.log(`Disabled reason:`, account.requirements.disabled_reason);
          
          // Find user and notify about additional verification needed
          const user = await (prisma as any).user.findFirst({
            where: { stripeConnectAccountId: account.id },
          });
          
          if (user) {
            console.log(`📧 User ${user.email} needs additional verification`);
            // TODO: Send notification email to user about additional verification
            // This could trigger an account update flow
          }
        }
        
        // Check if onboarding is complete (no requirements currently due)
        if (account.details_submitted && (!account.requirements || !account.requirements.currently_due || account.requirements.currently_due.length === 0)) {
          console.log('Account onboarding complete, checking for pending transfers...');
          
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
            
            console.log(`Found ${pendingGifts.length} pending gifts for user ${user.email}`);
            
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
                
                console.log(`✅ Transfer created for gift ${gift.id}: ${transfer.id}`);
              } catch (transferError) {
                console.error(`❌ Failed to create transfer for gift ${gift.id}:`, transferError);
              }
            }
          }
        }
        break;
      }

      case 'identity.verification_session.verified': {
        const verificationSession = event.data.object;
        console.log(`Identity verification completed: ${verificationSession.id}`);
        console.log(`Status: ${verificationSession.status}`);
        
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
            console.log(`✅ User identity verified for account: ${accountId}`);
          } catch (dbError) {
            console.error('Failed to update user verification status:', dbError);
          }
        }
        break;
      }

      case 'identity.verification_session.requires_input': {
        const verificationSession = event.data.object;
        console.log(`Identity verification requires input: ${verificationSession.id}`);
        console.log(`Last error:`, verificationSession.last_error);
        break;
      }

      case 'identity.verification_session.canceled': {
        const verificationSession = event.data.object;
        console.log(`Identity verification canceled: ${verificationSession.id}`);
        break;
      }

      // ===== ACCOUNTS V2 EVENTS =====
      
      case 'account.created' as any: {
        const account = (event as any).data.object;
        console.log(`✅ New v2 account created: ${account.id}`);
        console.log(`Email: ${account.email}`);
        console.log(`Country: ${account.country}`);
        console.log(`Configurations:`, account.configurations ? Object.keys(account.configurations) : 'None');
        break;
      }

      case 'account.deleted' as any: {
        const account = (event as any).data.object;
        console.log(`❌ Account deleted: ${account.id}`);
        // Handle account deletion if needed
        break;
      }

      case 'account_link.completed' as any: {
        const accountLink = (event as any).data.object;
        console.log(`🔗 Account link completed for account: ${accountLink.account}`);
        console.log(`Link type: ${accountLink.type}`);
        // Handle successful onboarding completion
        break;
      }

      // ===== IDENTITY VERIFICATION EVENTS =====
      
      case 'identity.verification_session.created': {
        const session = event.data.object;
        console.log(`🆔 Identity verification session created: ${session.id}`);
        console.log(`Account: ${session.metadata?.account_id}`);
        break;
      }

      case 'identity.verification_session.verified': {
        const session = event.data.object;
        console.log(`✅ Identity verification successful: ${session.id}`);
        console.log(`Account: ${session.metadata?.account_id}`);
        
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
            console.log(`✅ Updated user verification status for account: ${session.metadata.account_id}`);
          } catch (error) {
            console.error('❌ Failed to update user verification status:', error);
          }
        }
        break;
      }

      case 'identity.verification_session.requires_input': {
        const session = event.data.object;
        console.log(`⚠️ Identity verification requires input: ${session.id}`);
        console.log(`Account: ${session.metadata?.account_id}`);
        console.log(`Last error:`, session.last_error);
        break;
      }

      case 'identity.verification_session.canceled': {
        const session = event.data.object;
        console.log(`❌ Identity verification canceled: ${session.id}`);
        console.log(`Account: ${session.metadata?.account_id}`);
        break;
      }

      case 'identity.verification_session.expired' as any: {
        const session = (event as any).data.object;
        console.log(`⏰ Identity verification expired: ${session.id}`);
        console.log(`Account: ${session.metadata?.account_id}`);
        break;
      }

      // ===== OUTBOUND TRANSFER V2 EVENTS =====
      
      case 'outbound_transfer.created' as any: {
        const transfer = (event as any).data.object;
        console.log(`📤 Outbound transfer created: ${transfer.id}`);
        console.log(`Amount: ${transfer.amount} ${transfer.currency}`);
        console.log(`Destination: ${transfer.destination}`);
        break;
      }

      case 'outbound_transfer.succeeded' as any: {
        const transfer = (event as any).data.object;
        console.log(`✅ Outbound transfer succeeded: ${transfer.id}`);
        console.log(`Amount: ${transfer.amount} ${transfer.currency}`);
        console.log(`Destination: ${transfer.destination}`);
        break;
      }

      case 'outbound_transfer.failed' as any: {
        const transfer = (event as any).data.object;
        console.log(`❌ Outbound transfer failed: ${transfer.id}`);
        console.log(`Amount: ${transfer.amount} ${transfer.currency}`);
        console.log(`Destination: ${transfer.destination}`);
        console.log(`Failure reason:`, transfer.failure_code);
        break;
      }

      // ===== TRANSACTION V2 EVENTS =====
      
      case 'transaction.created' as any: {
        const transaction = (event as any).data.object;
        console.log(`💰 Transaction created: ${transaction.id}`);
        console.log(`Amount: ${transaction.amount} ${transaction.currency}`);
        console.log(`Type: ${transaction.type}`);
        break;
      }

      case 'transaction.updated' as any: {
        const transaction = (event as any).data.object;
        console.log(`📝 Transaction updated: ${transaction.id}`);
        console.log(`Status: ${transaction.status}`);
        break;
      }

      // ===== ACCOUNTS V2 CONFIGURATION EVENTS =====
      
      case 'account.merchant_configuration.updated' as any: {
        const account = (event as any).data.object;
        console.log(`🏪 Merchant configuration updated: ${account.id}`);
        console.log(`Charges enabled: ${account.configurations?.merchant?.charges_enabled}`);
        console.log(`Payouts enabled: ${account.configurations?.merchant?.payouts_enabled}`);
        break;
      }

      case 'account.customer_configuration.updated' as any: {
        const account = (event as any).data.object;
        console.log(`👤 Customer configuration updated: ${account.id}`);
        console.log(`Customer capabilities:`, account.configurations?.customer?.capabilities);
        break;
      }

      case 'account.requirements.updated' as any: {
        const account = (event as any).data.object;
        console.log(`📋 Account requirements updated: ${account.id}`);
        console.log(`Requirements:`, account.requirements);
        break;
      }

      case 'account.identity.updated' as any: {
        const account = (event as any).data.object;
        console.log(`🆔 Account identity updated: ${account.id}`);
        console.log(`Identity status:`, account.identity);
        break;
      }

      // ===== SUBSCRIPTION EVENTS (Future Features) =====
      
      case 'invoice.created': {
        const invoice = event.data.object;
        console.log(`📄 Invoice created: ${invoice.id}`);
        console.log(`Amount: ${invoice.amount_due} ${invoice.currency}`);
        console.log(`Customer: ${invoice.customer}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`✅ Invoice payment succeeded: ${invoice.id}`);
        console.log(`Amount: ${invoice.amount_paid} ${invoice.currency}`);
        console.log(`Customer: ${invoice.customer}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`❌ Invoice payment failed: ${invoice.id}`);
        console.log(`Amount: ${invoice.amount_due} ${invoice.currency}`);
        console.log(`Customer: ${invoice.customer}`);
        break;
      }

      case 'customer.entitlements.updated' as any: {
        const customer = (event as any).data.object;
        console.log(`🎫 Customer entitlements updated: ${customer.id}`);
        console.log(`Entitlements:`, customer.entitlements);
        break;
      }

      case 'subscription_schedule.created': {
        const schedule = event.data.object;
        console.log(`📅 Subscription schedule created: ${schedule.id}`);
        console.log(`Customer: ${schedule.customer}`);
        console.log(`Status: ${schedule.status}`);
        break;
      }

      case 'subscription_schedule.completed': {
        const schedule = event.data.object;
        console.log(`✅ Subscription schedule completed: ${schedule.id}`);
        console.log(`Customer: ${schedule.customer}`);
        break;
      }

      case 'subscription_schedule.canceled': {
        const schedule = event.data.object;
        console.log(`❌ Subscription schedule canceled: ${schedule.id}`);
        console.log(`Customer: ${schedule.customer}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
