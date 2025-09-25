import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log("=== SEND GIFT EMAIL AFTER PAYMENT API CALLED ===");
    const body = await request.json();
    const { paymentIntentId } = body;
    
    console.log("Payment Intent ID:", paymentIntentId);

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // Find gift by payment intent ID
    const gift = await prisma.gift.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!gift) {
      console.error('Gift not found for payment intent:', paymentIntentId);
      return NextResponse.json(
        { error: 'Gift not found for this payment' },
        { status: 404 }
      );
    }

    console.log('Found gift for email sending:', {
      giftId: gift.id,
      recipientEmail: gift.recipientEmail,
      amount: gift.amount,
      authenticationCode: gift.authenticationCode,
      senderEmail: gift.senderEmail
    });

    // Send email to recipient
    try {
      await sendGiftEmail({
        recipientEmail: gift.recipientEmail,
        giftId: gift.id,
        authenticationCode: gift.authenticationCode,
        amount: gift.amount,
        message: gift.message || undefined,
        senderEmail: gift.senderEmail,
      });
      console.log('✅ Email sent successfully after payment!');
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

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      giftId: gift.id,
      recipientEmail: gift.recipientEmail
    });

  } catch (error) {
    console.error('Error sending gift email after payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
