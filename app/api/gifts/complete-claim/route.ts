import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { updateUserLimits, checkUserLimits, LIMITS } from '@/lib/limits';

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
    const { accountId, email } = body;


    if (!accountId || !email) {
      return NextResponse.json(
        { error: 'Account ID and email are required' },
        { status: 400 }
      );
    }

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .or(`stripeConnectAccountId.eq.${accountId},stripeConnectAccountId.eq.acct_${accountId}`)
      .limit(1);
    
    const user = users?.[0];

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const stripeAccountId = accountId.startsWith('acct_') ? accountId : `acct_${accountId}`;
    const account = await stripe.accounts.retrieve(stripeAccountId);
    
    const isV2Account = (account as any).configurations !== undefined;
    let chargesEnabled = false;
    let payoutsEnabled = false;
    
    if (isV2Account) {
      const merchantConfig = (account as any).configurations?.merchant;
      chargesEnabled = merchantConfig?.charges_enabled || false;
      payoutsEnabled = merchantConfig?.payouts_enabled || false;
    } else {
      chargesEnabled = account.charges_enabled || false;
      payoutsEnabled = account.payouts_enabled || false;
    }
    
    if (!chargesEnabled || !payoutsEnabled) {
      return NextResponse.json(
        { error: 'Account not ready for transfers' },
        { status: 400 }
      );
    }

    const accountIdForLookup = accountId.startsWith('acct_') ? accountId.replace('acct_', '') : accountId;
    console.log('Looking for pending gifts for email:', email, 'accountId:', accountIdForLookup);
    
    const { data: pendingGifts } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('recipientEmail', email)
      .or(`stripeTransferId.eq.pending_${accountIdForLookup},stripeTransferId.eq.pending_acct_${accountIdForLookup}`)
      .eq('isClaimed', false);

    console.log('Found pending gifts:', pendingGifts?.length || 0);

    if (!pendingGifts || pendingGifts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending gifts to complete',
        completedGifts: 0,
      });
    }

    const totalPendingAmount = pendingGifts.reduce((sum: number, gift: any) => sum + gift.amount, 0);
    const limitCheck = await checkUserLimits(stripeAccountId, totalPendingAmount);
    
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: limitCheck.reason || 'Limiet overschreden',
          limitInfo: {
            currentAmount: limitCheck.currentAmount / 100,
            currentGiftCount: limitCheck.currentGiftCount,
            remainingAmount: limitCheck.remainingAmount / 100,
            remainingGifts: limitCheck.remainingGifts,
            monthlyLimit: LIMITS.MAX_MONTHLY_AMOUNT / 100,
            monthlyGiftLimit: LIMITS.MAX_MONTHLY_GIFTS,
          }
        },
        { status: 400 }
      );
    }

    const stripeAccount = await stripe.accounts.retrieve(accountId);
    
    const isV2AccountForRequirements = (stripeAccount as any).configurations !== undefined;
    let hasRequirements = false;
    let requirements = null;
    
    if (isV2AccountForRequirements) {
      requirements = stripeAccount.requirements;
      hasRequirements = requirements && (requirements as any).entries && 
        (requirements as any).entries.some((entry: any) => 
          entry.minimum_deadline?.status === 'currently_due'
        );
    } else {
      requirements = stripeAccount.requirements;
      hasRequirements = !!(requirements && requirements.currently_due && requirements.currently_due.length > 0);
    }
    
    if (hasRequirements) {
      return NextResponse.json({
        success: false,
        needsAdditionalVerification: true,
        requirements: isV2AccountForRequirements ? (requirements as any).entries : requirements?.currently_due,
        message: 'Additional verification required before transfers can be processed',
        accountStatus: {
          payoutsEnabled: isV2AccountForRequirements ? 
            (stripeAccount as any).configurations?.merchant?.payouts_enabled : 
            stripeAccount.payouts_enabled,
          detailsSubmitted: isV2AccountForRequirements ?
            (stripeAccount as any).configurations?.merchant?.details_submitted :
            stripeAccount.details_submitted,
          disabledReason: requirements?.disabled_reason
        }
      });
    }

    const completedGifts = [];
    for (const gift of pendingGifts || []) {
      try {
        console.log('Creating transfer for gift:', gift.id, 'amount:', gift.amount, 'to account:', stripeAccountId);
        
        const transfer = await stripe.transfers.create({
          amount: gift.amount,
          currency: gift.currency,
          destination: stripeAccountId,
          metadata: {
            giftId: gift.id,
            recipientEmail: email,
          },
        });

        console.log('Transfer created:', transfer.id);

        await updateUserLimits(stripeAccountId, gift.amount);

        await supabaseAdmin
          .from('gifts')
          .update({
            isClaimed: true,
            claimedAt: new Date().toISOString(),
            stripeTransferId: transfer.id,
          })
          .eq('id', gift.id);

        console.log('Gift updated with transfer ID:', transfer.id);

        completedGifts.push({
          giftId: gift.id,
          amount: gift.amount,
          transferId: transfer.id,
            });
      } catch (transferError) {
        console.error('Transfer error for gift', gift.id, ':', transferError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${completedGifts.length} gift(s) successfully claimed!`,
      completedGifts: completedGifts.length,
      gifts: completedGifts,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to complete gift claims',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
