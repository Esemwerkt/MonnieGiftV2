import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, giftId, email } = body;


    if (!accountId || !giftId || !email) {
      return NextResponse.json(
        { error: 'Account ID, gift ID, and email are required' },
        { status: 400 }
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/onboard/custom?account_id=${accountId}&gift_id=${giftId}&email=${encodeURIComponent(email)}`,
      return_url: `${process.env.NEXTAUTH_URL}/onboard/success?account_id=${accountId}&gift_id=${giftId}&email=${encodeURIComponent(email)}&onboarding_complete=true`,
      type: 'account_onboarding',
    });


    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      message: 'Onboarding link created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to create onboarding link',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
