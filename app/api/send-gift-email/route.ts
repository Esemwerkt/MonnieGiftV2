import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';

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
    const { giftId } = body;
    

    if (!giftId) {
      return NextResponse.json(
        { error: 'Gift ID is required' },
        { status: 400 }
      );
    }

    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    await sendGiftEmail({
      recipientEmail: gift.recipientEmail,
      giftId: gift.id,
      authenticationCode: gift.authenticationCode,
      amount: gift.amount,
      message: gift.message || undefined,
      senderEmail: gift.senderEmail,
    });


    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      giftId: gift.id
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
