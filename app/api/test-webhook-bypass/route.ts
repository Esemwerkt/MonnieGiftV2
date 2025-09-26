import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_' + Date.now(),
          status: 'succeeded',
          amount: 599,
          metadata: {
            giftId: body.giftId || 'cmg0ipdv800008wpxsdmx1a77', // Use provided giftId or the one from your payment
            giftAmount: '500',
            platformFee: '99',
            recipientEmail: 'enes@semwerkt.nl',
            senderEmail: 'enes@semwerkt.nl'
          }
        }
      }
    };
    
    
    const paymentIntent = mockEvent.data.object;
    const giftId = paymentIntent.metadata?.giftId;
    
    
    if (giftId && paymentIntent.status === 'succeeded') {
      let gift;
      try {
        gift = await prisma.gift.findUnique({
          where: { id: giftId },
        });
      } catch (dbError) {
        return NextResponse.json({ error: 'Database error', details: dbError }, { status: 500 });
      }
      
      if (gift) {
        try {
          const emailResult = await sendGiftEmail({
            recipientEmail: gift.recipientEmail,
            giftId: gift.id,
            authenticationCode: gift.authenticationCode,
            amount: gift.amount,
            message: gift.message || undefined,
            senderEmail: gift.senderEmail,
          });
          
          return NextResponse.json({
            success: true,
            message: 'Test webhook processed successfully',
            giftId: gift.id,
            emailSent: true,
            emailResult
          });
        } catch (emailError) {
          return NextResponse.json({ 
            error: 'Email sending failed', 
            details: emailError 
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({ 
          error: 'Gift not found', 
          giftId 
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({ 
        error: 'Invalid test data', 
        giftId, 
        status: paymentIntent.status 
      }, { status: 400 });
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test webhook failed', 
      details: error 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook bypass endpoint',
    usage: 'POST with { "giftId": "your-gift-id" } to test webhook logic'
  });
}
