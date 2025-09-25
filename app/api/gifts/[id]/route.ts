import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gift = await prisma.gift.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        amount: true,
        currency: true,
        message: true,
        senderEmail: true,
        recipientEmail: true,
        authenticationCode: true,
        isClaimed: true,
        claimedAt: true,
        createdAt: true,
        stripeTransferId: true,
      },
    });

    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(gift);
  } catch (error) {
    console.error('Error fetching gift:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gift' },
      { status: 500 }
    );
  }
}
