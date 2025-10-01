import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

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
    console.log('Looking for existing user with email:', email);
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Existing user found:', existingUser);
    console.log('Find error:', findError);

    if (existingUser) {
      console.log('Updating existing user:', existingUser.id);
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          stripeConnectAccountId: accountId,
          isVerified: true,
          identityVerifiedAt: new Date().toISOString(),
        })
        .eq('id', existingUser.id);
      
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log('User updated successfully');
      }
    } else {
      console.log('Creating new user for email:', email);
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          email,
          stripeConnectAccountId: accountId,
          isVerified: true,
          identityVerifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        console.log('User created successfully:', newUser);
      }
    }

    // Process any pending gifts for this user
    const { data: pendingGifts } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('recipientEmail', email)
      .like('stripeTransferId', 'pending_%')
      .eq('isClaimed', false);

    // Check account status but don't fail if not fully ready
    const account = await stripe.accounts.retrieve(accountId);
    
    console.log('Account status:', {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });
    
    // If account is not ready for transfers, we'll still save the user
    // but won't process transfers yet
    const isAccountReady = account.charges_enabled && account.payouts_enabled;

    // Process transfers only if account is ready
    if (isAccountReady && pendingGifts && pendingGifts.length > 0) {
      console.log(`Processing ${pendingGifts.length} pending gifts for account ${accountId}`);
      
      for (const gift of pendingGifts) {
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
    } else if (pendingGifts && pendingGifts.length > 0) {
      console.log(`Account not ready for transfers. ${pendingGifts.length} gifts will be processed when account is ready.`);
    }

    return NextResponse.json({
      success: true,
      message: isAccountReady 
        ? 'Express onboarding completed successfully' 
        : 'Account created successfully. Complete verification to receive transfers.',
      accountReady: isAccountReady,
      accountStatus: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      }
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
