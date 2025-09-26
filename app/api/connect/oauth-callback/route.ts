import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, giftId, email } = body;

    if (!code || !state || !giftId || !email) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });

    const { stripe_user_id: accountId } = response;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Failed to get account ID from OAuth response' },
        { status: 400 }
      );
    }

    // Update user record with the connected account ID
    await supabaseAdmin
      .from('users')
      .update({
        stripeConnectAccountId: accountId,
        isVerified: true,
        identityVerifiedAt: new Date().toISOString(),
      })
      .eq('email', email);

    // Process any pending gifts for this user
    const { data: pendingGifts } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('recipientEmail', email)
      .like('stripeTransferId', 'pending_%')
      .eq('isClaimed', false);

    // Process each pending gift
    for (const gift of pendingGifts || []) {
      try {
        const transfer = await stripe.transfers.create({
          amount: gift.amount, 
          currency: gift.currency,
          destination: accountId,
          description: 'MonnieGift uitbetaling',
          metadata: {
            giftId: gift.id,
            recipientEmail: email,
          },
        });
        
        await supabaseAdmin
          .from('gifts')
          .update({
            isClaimed: true,
            claimedAt: new Date().toISOString(),
            stripeTransferId: transfer.id,
          })
          .eq('id', gift.id);
        
      } catch (transferError) {
        console.error(`Failed to transfer gift ${gift.id}:`, transferError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OAuth callback processed successfully',
      accountId,
    });
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process OAuth callback',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
