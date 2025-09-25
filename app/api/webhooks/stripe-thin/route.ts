import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

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

  console.log('Thin payload webhook received!');
  console.log('Signature present:', !!signature);
  console.log('Webhook secret present:', !!process.env.STRIPE_WEBHOOK_SECRET_THIN);

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET_THIN) {
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
      process.env.STRIPE_WEBHOOK_SECRET_THIN
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    console.log(`📦 Thin payload event: ${event.type}`);
    console.log(`Event ID: ${event.id}`);
    console.log(`Created: ${new Date(event.created * 1000).toISOString()}`);

    switch (event.type) {
      // ===== THIN PAYLOAD SPECIFIC EVENTS =====
      
      case 'account.requirements.updated' as any: {
        // For thin payloads, we need to fetch the full account data
        const accountId = (event as any).data.object.id;
        console.log(`📋 Account requirements updated (thin): ${accountId}`);
        
        try {
          const account = await stripe.accounts.retrieve(accountId);
          console.log(`Full account data fetched for: ${accountId}`);
          console.log(`Requirements:`, account.requirements);
          
          // Handle requirements update logic here
          // This is where you'd implement specific business logic
          
        } catch (error) {
          console.error(`Failed to fetch account ${accountId}:`, error);
        }
        break;
      }

      case 'account.identity.updated' as any: {
        const accountId = (event as any).data.object.id;
        console.log(`🆔 Account identity updated (thin): ${accountId}`);
        
        try {
          const account = await stripe.accounts.retrieve(accountId);
          console.log(`Identity status:`, (account as any).identity);
          
          // Handle identity update logic here
          
        } catch (error) {
          console.error(`Failed to fetch account ${accountId}:`, error);
        }
        break;
      }

      case 'account.merchant_configuration.updated' as any: {
        const accountId = (event as any).data.object.id;
        console.log(`🏪 Merchant configuration updated (thin): ${accountId}`);
        
        try {
          const account = await stripe.accounts.retrieve(accountId);
          const merchantConfig = (account as any).configurations?.merchant;
          console.log(`Merchant config:`, merchantConfig);
          
          // Handle merchant configuration update logic here
          
        } catch (error) {
          console.error(`Failed to fetch account ${accountId}:`, error);
        }
        break;
      }

      case 'account.customer_configuration.updated' as any: {
        const accountId = (event as any).data.object.id;
        console.log(`👤 Customer configuration updated (thin): ${accountId}`);
        
        try {
          const account = await stripe.accounts.retrieve(accountId);
          const customerConfig = (account as any).configurations?.customer;
          console.log(`Customer config:`, customerConfig);
          
          // Handle customer configuration update logic here
          
        } catch (error) {
          console.error(`Failed to fetch account ${accountId}:`, error);
        }
        break;
      }

      // ===== SUBSCRIPTION EVENTS (Thin Payload) =====
      
      case 'invoice.created' as any: {
        const invoiceId = (event as any).data.object.id;
        console.log(`📄 Invoice created (thin): ${invoiceId}`);
        
        try {
          const invoice = await stripe.invoices.retrieve(invoiceId);
          console.log(`Invoice details:`, {
            id: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            customer: invoice.customer
          });
          
          // Handle invoice creation logic here
          
        } catch (error) {
          console.error(`Failed to fetch invoice ${invoiceId}:`, error);
        }
        break;
      }

      case 'invoice.payment_succeeded' as any: {
        const invoiceId = (event as any).data.object.id;
        console.log(`✅ Invoice payment succeeded (thin): ${invoiceId}`);
        
        try {
          const invoice = await stripe.invoices.retrieve(invoiceId);
          console.log(`Payment details:`, {
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            customer: invoice.customer
          });
          
          // Handle successful payment logic here
          
        } catch (error) {
          console.error(`Failed to fetch invoice ${invoiceId}:`, error);
        }
        break;
      }

      case 'customer.entitlements.updated' as any: {
        const customerId = (event as any).data.object.id;
        console.log(`🎫 Customer entitlements updated (thin): ${customerId}`);
        
        try {
          const customer = await stripe.customers.retrieve(customerId);
          console.log(`Customer entitlements:`, (customer as any).entitlements);
          
          // Handle entitlements update logic here
          
        } catch (error) {
          console.error(`Failed to fetch customer ${customerId}:`, error);
        }
        break;
      }

      default:
        console.log(`Unhandled thin payload event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing thin payload webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
