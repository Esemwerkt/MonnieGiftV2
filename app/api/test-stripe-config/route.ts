import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
    const hasPublishableKey = !!process.env.STRIPE_PUBLISHABLE_KEY;
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!hasSecretKey) {
      return NextResponse.json({
        success: false,
        error: 'STRIPE_SECRET_KEY is not set',
        environment: {
          STRIPE_SECRET_KEY: hasSecretKey,
          STRIPE_PUBLISHABLE_KEY: hasPublishableKey,
          STRIPE_WEBHOOK_SECRET: hasWebhookSecret,
        }
      }, { status: 500 });
    }

    // Test Stripe connection
    try {
      const account = await stripe.accounts.retrieve();
      
      return NextResponse.json({
        success: true,
        message: 'Stripe is properly configured',
        account: {
          id: account.id,
          country: account.country,
          type: account.type,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        },
        environment: {
          STRIPE_SECRET_KEY: hasSecretKey,
          STRIPE_PUBLISHABLE_KEY: hasPublishableKey,
          STRIPE_WEBHOOK_SECRET: hasWebhookSecret,
        },
        connect: {
          canCreateAccounts: true,
          supportedCountries: ['NL'],
          expressAccountsSupported: true,
        }
      });
    } catch (stripeError) {
      return NextResponse.json({
        success: false,
        error: 'Stripe connection failed',
        details: stripeError instanceof Error ? stripeError.message : String(stripeError),
        environment: {
          STRIPE_SECRET_KEY: hasSecretKey,
          STRIPE_PUBLISHABLE_KEY: hasPublishableKey,
          STRIPE_WEBHOOK_SECRET: hasWebhookSecret,
        }
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check Stripe configuration',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
