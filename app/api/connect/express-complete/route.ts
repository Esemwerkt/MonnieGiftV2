import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, giftId, email } = body;

    if (!accountId || !email) {
      return NextResponse.json(
        { error: 'Account ID and email are required' },
        { status: 400 }
      );
    }

    // Update user record with the connected account ID
    await (prisma as any).user.upsert({
      where: { email },
      update: {
        stripeConnectAccountId: accountId,
        isVerified: true,
        identityVerifiedAt: new Date(),
      },
      create: {
        email,
        stripeConnectAccountId: accountId,
        isVerified: true,
        identityVerifiedAt: new Date(),
      },
    });

    // Process any pending gifts for this user
    const pendingGifts = await prisma.gift.findMany({
      where: {
        recipientEmail: email,
        stripeTransferId: {
          startsWith: 'pending_',
        },
        isClaimed: false,
      },
    });

    // Process each pending gift
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
        
        await prisma.gift.update({
          where: { id: gift.id },
          data: {
            isClaimed: true,
            claimedAt: new Date(),
            stripeTransferId: transfer.id,
          },
        });
        
      } catch (transferError) {
        console.error(`Failed to transfer gift ${gift.id}:`, transferError);
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
