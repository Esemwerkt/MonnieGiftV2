import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, giftId, email } = body;

    if (!accountId || !email) {
      console.error('Missing required parameters:', { accountId, email, giftId });
      return NextResponse.json(
        { error: 'Account ID and email are required' },
        { status: 400 }
      );
    }

    // Update user record with the connected account ID
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      await supabaseAdmin
        .from('users')
        .update({
          stripeConnectAccountId: accountId,
          isVerified: true,
          identityVerifiedAt: new Date().toISOString(),
        })
        .eq('id', existingUser.id);
    } else {
      await supabaseAdmin
        .from('users')
        .insert({
          email,
          stripeConnectAccountId: accountId,
          isVerified: true,
          identityVerifiedAt: new Date().toISOString(),
        });
    }

    // Process any pending gifts for this user
    const { data: pendingGifts } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('recipientEmail', email)
      .like('stripeTransferId', 'pending_%')
      .eq('isClaimed', false);

    // Check if account is ready for transfers
    const account = await stripe.accounts.retrieve(accountId);
    
    if (!account.charges_enabled || !account.payouts_enabled) {
      return NextResponse.json(
        { 
          error: 'Account not ready for transfers',
          message: 'Je account is nog niet volledig ingesteld. Voltooi eerst de verificatie.',
          accountStatus: {
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
          }
        },
        { status: 400 }
      );
    }

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
        
      } catch (transferError: any) {
        console.error(`Failed to transfer gift ${gift.id}:`, transferError);
        
        // Handle specific transfer errors
        if (transferError.type === 'invalid_request_error') {
          return NextResponse.json(
            { 
              error: 'Transfer failed',
              code: transferError.code,
              message: 'Er is een probleem opgetreden bij het overmaken van je cadeau. Probeer het opnieuw.',
              details: transferError.message
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Express onboarding completed successfully',
    });
  } catch (error) {
    console.error('Error in Express onboarding completion:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete Express onboarding',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
