import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

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

    // Create Express account first
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'NL',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Create account link for Express onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://monnie-gift-v222.vercel.app'}/stripe/terug?account_id=${account.id}&gift_id=${giftId}&email=${encodeURIComponent(email)}`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://monnie-gift-v222.vercel.app'}/stripe/terug?account_id=${account.id}&gift_id=${giftId}&email=${encodeURIComponent(email)}`,
      type: 'account_onboarding',
    });

    const link = accountLink.url;

    return NextResponse.json({
      success: true,
      onboardingUrl: link,
    });
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create onboarding link',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}