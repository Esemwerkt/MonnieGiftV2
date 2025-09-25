import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, giftId, email } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // For Express accounts, we need to use the Express onboarding URL directly
    // First, let's verify this is an Express account
    const account = await stripe.accounts.retrieve(accountId);
    
    if (account.type !== 'express') {
      return NextResponse.json(
        { error: 'Account is not an Express account' },
        { status: 400 }
      );
    }

    // For Express accounts, we need to create an account link that will use Express onboarding
    // The key is to ensure the account is properly configured for Express
    const returnUrl = giftId && email 
      ? `${process.env.NEXTAUTH_URL}/claim/${giftId}?email=${encodeURIComponent(email)}&onboarding_complete=true&auto_claim=true&account_id=${accountId}`
      : `${process.env.NEXTAUTH_URL}/onboard/success?account_id=${accountId}`;
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/onboard?account_id=${accountId}`,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      onboardingUrl: accountLink.url,
      message: 'Express onboarding link created successfully',
    });
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
