import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

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


  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET_THIN) {
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
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {

    switch (event.type) {
      
      case 'account.requirements.updated' as any: {
        const accountId = (event as any).data.object.id;
        
        try {
          const account = await stripe.accounts.retrieve(accountId);
          
          
        } catch (error) {
        }
        break;
      }

      case 'account.identity.updated' as any: {
        const accountId = (event as any).data.object.id;
        
        try {
          const account = await stripe.accounts.retrieve(accountId);
          
          
        } catch (error) {
        }
        break;
      }

      case 'account.merchant_configuration.updated' as any: {
        const accountId = (event as any).data.object.id;
        
        try {
          const account = await stripe.accounts.retrieve(accountId);
          const merchantConfig = (account as any).configurations?.merchant;
          
          
        } catch (error) {
        }
        break;
      }

      case 'account.customer_configuration.updated' as any: {
        const accountId = (event as any).data.object.id;
        
        try {
          const account = await stripe.accounts.retrieve(accountId);
          const customerConfig = (account as any).configurations?.customer;
          
          
        } catch (error) {
        }
        break;
      }

      
      case 'invoice.created' as any: {
        const invoiceId = (event as any).data.object.id;
        
        try {
          const invoice = await stripe.invoices.retrieve(invoiceId);
          
          
        } catch (error) {
        }
        break;
      }

      case 'invoice.payment_succeeded' as any: {
        const invoiceId = (event as any).data.object.id;
        
            try {
              const invoice = await stripe.invoices.retrieve(invoiceId);
          
          
        } catch (error) {
        }
        break;
      }

      case 'customer.entitlements.updated' as any: {
        const customerId = (event as any).data.object.id;
        
        try {
          const customer = await stripe.customers.retrieve(customerId);
          
          
        } catch (error) {
        }
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
