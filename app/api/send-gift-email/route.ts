import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log("=== SEND GIFT EMAIL API CALLED ===");
    const body = await request.json();
    const { giftId } = body;
    
    console.log("Gift ID:", giftId);

    if (!giftId) {
      return NextResponse.json(
        { error: 'Gift ID is required' },
        { status: 400 }
      );
    }

    // Get gift details from database
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      console.error('Gift not found:', giftId);
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    console.log('Found gift:', {
      id: gift.id,
      recipientEmail: gift.recipientEmail,
      amount: gift.amount,
      authenticationCode: gift.authenticationCode,
      senderEmail: gift.senderEmail
    });

    // Send email
    await sendGiftEmail({
      recipientEmail: gift.recipientEmail,
      giftId: gift.id,
      authenticationCode: gift.authenticationCode,
      amount: gift.amount,
      message: gift.message || undefined,
      senderEmail: gift.senderEmail,
    });

    console.log('✅ Email sent successfully for gift:', giftId);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      giftId: gift.id
    });

  } catch (error) {
    console.error('Error sending gift email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
