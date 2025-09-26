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

    // Create onboarding link according to playbook
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://monnie-gift-v222.vercel.app'}/stripe/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://monnie-gift-v222.vercel.app'}/stripe/terug?gift_id=${giftId}&email=${encodeURIComponent(email)}`,
    });

    return NextResponse.json({
      success: true,
      onboardingUrl: link.url,
      expiresAt: link.expires_at,
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