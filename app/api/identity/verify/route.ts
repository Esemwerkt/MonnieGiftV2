import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { stripe } from '@/lib/stripe';

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

    console.log(`🔐 Creating Stripe Identity verification for account: ${accountId}`);

    // Create a verification session for the connected account
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      return_url: `${process.env.NEXTAUTH_URL}/claim/${giftId}?email=${encodeURIComponent(email)}&identity_verified=true&account_id=${accountId}`,
      metadata: {
        account_id: accountId,
        gift_id: giftId || '',
        email: email || '',
        platform: 'monniegift',
      },
    });

    console.log(`✅ Identity verification session created: ${verificationSession.id}`);

    return NextResponse.json({
      success: true,
      verificationSessionId: verificationSession.id,
      verificationUrl: verificationSession.url,
      message: 'Identity verification session created successfully',
    });

  } catch (error) {
    console.error('Error creating identity verification session:', error);
    
    // Check if it's a Stripe Identity not available error
    if (error instanceof Error && error.message.includes('identity')) {
      return NextResponse.json(
        { 
          error: 'Stripe Identity is not available for this account. Please contact support.',
          details: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create identity verification session',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verificationSessionId = searchParams.get('verification_session_id');

    if (!verificationSessionId) {
      return NextResponse.json(
        { error: 'Verification session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the verification session
    const verificationSession = await stripe.identity.verificationSessions.retrieve(verificationSessionId);

    return NextResponse.json({
      success: true,
      verificationSession: {
        id: verificationSession.id,
        status: verificationSession.status,
        type: verificationSession.type,
        lastError: verificationSession.last_error,
        verifiedAt: (verificationSession as any).verified_at,
        expiresAt: (verificationSession as any).expires_at,
      },
    });

  } catch (error) {
    console.error('Error retrieving verification session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve verification session' },
      { status: 500 }
    );
  }
}
