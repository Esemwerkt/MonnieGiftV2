import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const account = await stripe.accounts.retrieve(accountId);

    const isV2Account = (account as any).configurations !== undefined;
    
    if (isV2Account) {
      const merchantConfig = (account as any).configurations?.merchant;
      const customerConfig = (account as any).configurations?.customer;
      
      return NextResponse.json({
        id: account.id,
        type: 'accounts_v2',
        chargesEnabled: merchantConfig?.charges_enabled || false,
        payoutsEnabled: merchantConfig?.payouts_enabled || false,
        detailsSubmitted: merchantConfig?.details_submitted || false,
        country: account.country,
        defaultCurrency: account.default_currency,
        businessType: merchantConfig?.business_type,
        email: account.email,
        configurations: {
          merchant: {
            enabled: !!merchantConfig,
            chargesEnabled: merchantConfig?.charges_enabled,
            payoutsEnabled: merchantConfig?.payouts_enabled,
            detailsSubmitted: merchantConfig?.details_submitted,
          },
          customer: {
            enabled: !!customerConfig,
          },
        },
        requirements: account.requirements,
        identity: (account as any).identity,
      });
    } else {
      return NextResponse.json({
        id: account.id,
        type: account.type || 'express',
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        country: account.country,
        defaultCurrency: account.default_currency,
        businessType: account.business_type,
        email: account.email,
        configurations: {
          merchant: {
            enabled: true,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
          },
          customer: {
            enabled: false,
          },
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}
