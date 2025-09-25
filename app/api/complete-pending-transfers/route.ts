import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}

export async function POST(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'production' && !request) {
      return NextResponse.json({ message: 'Route not available during build' }, { status: 503 });
    }

    // Find all pending gifts
    const pendingGifts = await prisma.gift.findMany({
      where: {
        stripeTransferId: {
          startsWith: 'pending_',
        },
        isClaimed: false,
      },
    });

    console.log(`Found ${pendingGifts.length} pending gifts`);

    const results = [];

    for (const gift of pendingGifts) {
      try {
        // Extract account ID from pending transfer ID
        // Handle both formats: pending_${accountId} and pending_acct_${accountId}
        let accountId = gift.stripeTransferId?.replace('pending_acct_', '');
        if (!accountId || accountId === gift.stripeTransferId) {
          accountId = gift.stripeTransferId?.replace('pending_', '');
        }
        
        if (!accountId) {
          console.error(`Invalid pending transfer ID for gift ${gift.id}`);
          continue;
        }

        // Check account status (works for both v1 and v2)
        const account = await stripe.accounts.retrieve(accountId);
        
        // Handle both v1 and v2 account formats
        const isV2Account = (account as any).configurations !== undefined;
        let chargesEnabled = false;
        let payoutsEnabled = false;
        let detailsSubmitted = false;
        
        if (isV2Account) {
          // Accounts v2 format
          const merchantConfig = (account as any).configurations?.merchant;
          chargesEnabled = merchantConfig?.charges_enabled || false;
          payoutsEnabled = merchantConfig?.payouts_enabled || false;
          detailsSubmitted = merchantConfig?.details_submitted || false;
        } else {
          // Accounts v1 format
          chargesEnabled = account.charges_enabled || false;
          payoutsEnabled = account.payouts_enabled || false;
          detailsSubmitted = account.details_submitted || false;
        }
        
        console.log(`Account ${accountId} status:`, {
          type: isV2Account ? 'v2' : 'v1',
          charges_enabled: chargesEnabled,
          payouts_enabled: payoutsEnabled,
          details_submitted: detailsSubmitted,
        });

        // Only transfer if account is ready
        if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
          console.log(`Creating transfer for gift ${gift.id}: ${gift.amount} ${gift.currency} to account ${accountId}`);
          
          const transfer = await stripe.transfers.create({
            amount: gift.amount,
            currency: gift.currency,
            destination: accountId,
            metadata: {
              giftId: gift.id,
              recipientEmail: gift.recipientEmail,
            },
          });

          console.log(`Transfer created successfully: ${transfer.id}`);

          // Update gift as claimed
          await prisma.gift.update({
            where: { id: gift.id },
            data: {
              isClaimed: true,
              claimedAt: new Date(),
              stripeTransferId: transfer.id,
            },
          });

          console.log(`Gift ${gift.id} marked as claimed`);
          
          results.push({
            giftId: gift.id,
            status: 'completed',
            transferId: transfer.id,
            amount: gift.amount,
          });
        } else {
          console.log(`Account ${accountId} not ready for transfers yet`);
          results.push({
            giftId: gift.id,
            status: 'account_not_ready',
            accountId: accountId,
            accountType: isV2Account ? 'v2' : 'v1',
            charges_enabled: chargesEnabled,
            payouts_enabled: payoutsEnabled,
            details_submitted: detailsSubmitted,
          });
        }
      } catch (error) {
        console.error(`Failed to complete gift ${gift.id}:`, error);
        results.push({
          giftId: gift.id,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingGifts.length} pending gifts`,
      results: results,
    });

  } catch (error) {
    console.error('Error completing pending transfers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete pending transfers',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
