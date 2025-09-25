import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, giftId, email } = body;

    console.log('=== CUSTOM ONBOARD API CALLED ===');
    console.log('Request body:', body);

    if (!accountId || !giftId || !email) {
      return NextResponse.json(
        { error: 'Account ID, gift ID, and email are required' },
        { status: 400 }
      );
    }

    // Create Stripe account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/onboard/custom?account_id=${accountId}&gift_id=${giftId}&email=${encodeURIComponent(email)}`,
      return_url: `${process.env.NEXTAUTH_URL}/onboard/success?account_id=${accountId}&gift_id=${giftId}&email=${encodeURIComponent(email)}&onboarding_complete=true`,
      type: 'account_onboarding',
    });

    console.log('Account link created:', accountLink.url);

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      message: 'Onboarding link created successfully',
    });
  } catch (error) {
    console.error('Error creating custom onboard link:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create onboarding link',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
