import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { updateUserLimits, checkUserLimits, LIMITS } from '@/lib/limits';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, email } = body;

    console.log('=== COMPLETE CLAIM API CALLED ===');
    console.log('Request body:', body);

    if (!accountId || !email) {
      return NextResponse.json(
        { error: 'Account ID and email are required' },
        { status: 400 }
      );
    }

    // Find user by email and account ID (handle both formats)
    const user = await (prisma as any).user.findFirst({
      where: {
        email: email,
        OR: [
          { stripeConnectAccountId: accountId },
          { stripeConnectAccountId: `acct_${accountId}` }
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if account is ready for transfers (works for both v1 and v2)
    // Handle account ID format (with or without acct_ prefix)
    const stripeAccountId = accountId.startsWith('acct_') ? accountId : `acct_${accountId}`;
    const account = await stripe.accounts.retrieve(stripeAccountId);
    
    // Handle both v1 and v2 account formats
    const isV2Account = (account as any).configurations !== undefined;
    let chargesEnabled = false;
    let payoutsEnabled = false;
    
    if (isV2Account) {
      // Accounts v2 format
      const merchantConfig = (account as any).configurations?.merchant;
      chargesEnabled = merchantConfig?.charges_enabled || false;
      payoutsEnabled = merchantConfig?.payouts_enabled || false;
    } else {
      // Accounts v1 format
      chargesEnabled = account.charges_enabled || false;
      payoutsEnabled = account.payouts_enabled || false;
    }
    
    if (!chargesEnabled || !payoutsEnabled) {
      return NextResponse.json(
        { error: 'Account not ready for transfers' },
        { status: 400 }
      );
    }

    // Find pending gifts for this user
    // Handle both formats: pending_${accountId} and pending_acct_${accountId}
    // Handle account ID format for lookup
    const accountIdForLookup = accountId.startsWith('acct_') ? accountId.replace('acct_', '') : accountId;
    const pendingGifts = await prisma.gift.findMany({
      where: {
        recipientEmail: email,
        OR: [
          { stripeTransferId: `pending_${accountIdForLookup}` },
          { stripeTransferId: `pending_acct_${accountIdForLookup}` }
        ],
        isClaimed: false,
      },
    });

    console.log('=== COMPLETE CLAIM DEBUG ===');
    console.log('accountId:', accountId);
    console.log('accountIdForLookup:', accountIdForLookup);
    console.log('email:', email);
    console.log('Found pending gifts:', pendingGifts.length);
    console.log('Pending gifts details:', pendingGifts.map(g => ({
      id: g.id,
      amount: g.amount,
      stripeTransferId: g.stripeTransferId,
      isClaimed: g.isClaimed
    })));

    if (pendingGifts.length === 0) {
      console.log('No pending gifts found for account:', accountId);
      return NextResponse.json({
        success: true,
        message: 'No pending gifts to complete',
        completedGifts: 0,
      });
    }

    // Check user limits before processing transfers (based on KYC-verified Stripe account)
    const totalPendingAmount = pendingGifts.reduce((sum, gift) => sum + gift.amount, 0);
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

    // Check if account has additional KYC requirements before processing transfers
    const stripeAccount = await stripe.accounts.retrieve(accountId);
    
    // Handle both v1 and v2 requirements format
    const isV2AccountForRequirements = (stripeAccount as any).configurations !== undefined;
    let hasRequirements = false;
    let requirements = null;
    
    if (isV2AccountForRequirements) {
      // Accounts v2 format - requirements are in a different structure
      requirements = stripeAccount.requirements;
      hasRequirements = requirements && (requirements as any).entries && 
        (requirements as any).entries.some((entry: any) => 
          entry.minimum_deadline?.status === 'currently_due'
        );
    } else {
      // Accounts v1 format
      requirements = stripeAccount.requirements;
      hasRequirements = !!(requirements && requirements.currently_due && requirements.currently_due.length > 0);
    }
    
    if (hasRequirements) {
      console.log('Account has additional KYC requirements:', 
        isV2AccountForRequirements ? (requirements as any).entries : requirements?.currently_due
      );
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

    // Complete transfers for all pending gifts
    const completedGifts = [];
    for (const gift of pendingGifts) {
      try {
        // Create transfer to user's Stripe account
        const transfer = await stripe.transfers.create({
          amount: gift.amount,
          currency: gift.currency,
          destination: stripeAccountId,
          metadata: {
            giftId: gift.id,
            recipientEmail: email,
          },
        });

        await updateUserLimits(stripeAccountId, gift.amount);

        await prisma.gift.update({
          where: { id: gift.id },
          data: {
            isClaimed: true,
            claimedAt: new Date(),
            stripeTransferId: transfer.id,
          },
        });

        completedGifts.push({
          giftId: gift.id,
          amount: gift.amount,
          transferId: transfer.id,
        });

        console.log('Gift claim completed:', {
          giftId: gift.id,
          amount: gift.amount,
          recipientEmail: email,
          transferId: transfer.id,
        });
      } catch (transferError) {
        console.error('Error completing transfer for gift:', gift.id, transferError);
        // Continue with other gifts even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `${completedGifts.length} gift(s) successfully claimed!`,
      completedGifts: completedGifts.length,
      gifts: completedGifts,
    });
  } catch (error) {
    console.error('Error completing gift claims:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete gift claims',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
