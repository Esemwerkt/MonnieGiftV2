import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { generateVerificationCode } from '@/lib/auth';
import { sendGiftEmail } from '@/lib/email';
import { checkUserLimits, LIMITS } from '@/lib/limits';

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
    
    console.log('Received gift creation data:', body);
    
    const { 
      amount, 
      currency = 'eur', 
      message, 
      senderEmail, 
      recipientEmail,
      animationPreset = 'confettiRealistic'
    } = body;

    if (!amount || !senderEmail || !recipientEmail) {
      return NextResponse.json(
        { error: 'Bedrag, verzender e-mail en ontvanger e-mail zijn vereist' },
        { status: 400 }
      );
    }

    let existingUser = null;
    try {
      existingUser = await (prisma as any).user.findUnique({
        where: { email: recipientEmail },
      });
    } catch (dbError) {
    }

    if (existingUser && existingUser.stripeConnectAccountId) {
      const limitCheck = await checkUserLimits(existingUser.stripeConnectAccountId, amount);
      
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
    }

    const authenticationCode = generateVerificationCode();

    let gift;
    try {
      const giftData = {
        amount,
        currency,
        message,
        senderEmail,
        recipientEmail,
        authenticationCode,
        animationPreset,
      };
      
      console.log('Creating gift with data:', giftData);
      
      gift = await prisma.gift.create({
        data: giftData,
      });
    } catch (dbError) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check your environment variables.',
          details: 'Unable to create gift record in database'
        },
        { status: 500 }
      );
    }

    const giftAmount = amount;
    const platformFee = 99;
    const totalAmount = giftAmount + platformFee;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency.toLowerCase(),
      payment_method_types: ['ideal'],
      description: `MonnieGift - Gift €${(giftAmount/100).toFixed(2)} + Service fee €${(platformFee/100).toFixed(2)}`,
      metadata: {
        giftId: gift.id,
        giftAmount: giftAmount.toString(),
        platformFee: platformFee.toString(),
        totalAmount: totalAmount.toString(),
        senderEmail,
        recipientEmail,
      },
    });

    await prisma.gift.update({
      where: { id: gift.id },
      data: { 
        stripePaymentIntentId: paymentIntent.id,
      },
    });


    

    return NextResponse.json({
      success: true,
      giftId: gift.id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      giftAmount: giftAmount,
      platformFee: platformFee,
      totalAmount: totalAmount,
      message: 'Gift created successfully. Please complete payment to send the gift.',
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Cadeau aanmaken mislukt',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
