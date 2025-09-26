import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const { paymentIntentId } = params;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const gift = await prisma.gift.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
    });

    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found for this payment intent' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      id: gift.id,
      amount: gift.amount,
      currency: gift.currency,
      message: gift.message,
      senderEmail: gift.senderEmail,
      recipientEmail: gift.recipientEmail,
      isClaimed: gift.isClaimed,
      claimedAt: gift.claimedAt,
      createdAt: gift.createdAt,
      authenticationCode: gift.authenticationCode,
      animationPreset: gift.animationPreset,
    });

  } catch (error) {
    console.error('Error fetching gift by payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gift' },
      { status: 500 }
    );
  }
}
