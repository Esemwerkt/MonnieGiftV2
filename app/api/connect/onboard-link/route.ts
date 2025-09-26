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

    // Create OAuth link for Express onboarding
    const link = await stripe.oauth.authorizeUrl({
      client_id: process.env.TEST_CLIENT_ID || 'ca_T7CBc0ces4KI6ZjnZyQfmRthI17yuwp6',
      response_type: 'code',
      scope: 'read_write',
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://monnie-gift-v222.vercel.app'}/stripe/terug`,
      state: `gift_${giftId}_${email}`,
    });

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