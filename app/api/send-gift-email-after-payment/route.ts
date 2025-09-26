import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;

    console.log('=== SEND GIFT EMAIL AFTER PAYMENT ===');
    console.log('PaymentIntent ID:', paymentIntentId);

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'PaymentIntent ID is required' },
        { status: 400 }
      );
    }

    // Find gift by payment intent ID
    const gift = await prisma.gift.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!gift) {
      console.error('❌ Gift not found for PaymentIntent:', paymentIntentId);
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    console.log('Found gift for email sending:', {
      giftId: gift.id,
      recipientEmail: gift.recipientEmail,
      amount: gift.amount,
      authenticationCode: gift.authenticationCode
    });

    // Send email to recipient
    try {
      const emailResult = await sendGiftEmail({
        recipientEmail: gift.recipientEmail,
        giftId: gift.id,
        authenticationCode: gift.authenticationCode,
        amount: gift.amount,
        message: gift.message || undefined,
        senderEmail: gift.senderEmail,
      });
      
      console.log('✅ Email sent successfully after payment!', emailResult);
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        giftId: gift.id,
        emailResult
      });
    } catch (emailError) {
      console.error('❌ Failed to send email after payment:', emailError);
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: emailError instanceof Error ? emailError.message : String(emailError)
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Send gift email after payment failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send gift email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}