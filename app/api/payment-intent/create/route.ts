import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { checkUserLimits, LIMITS } from '@/lib/limits';
import { prisma } from '@/lib/prisma';
import { generateVerificationCode } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      amount, 
      currency = 'eur', 
      message, 
      senderEmail, 
      recipientEmail,
      animationPreset
    } = body;
    
    // Ensure animationPreset is not undefined, null, or empty string
    const finalAnimationPreset = animationPreset && animationPreset.trim() !== '' ? animationPreset : 'confettiRealistic';

    if (!amount || !senderEmail || !recipientEmail) {
      return NextResponse.json(
        { error: 'Bedrag, verzender e-mail en ontvanger e-mail zijn vereist' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 100) { // Minimum €1.00
      return NextResponse.json(
        { error: 'Minimum cadeau bedrag is €1.00' },
        { status: 400 }
      );
    }

    if (amount > 500000) { // Maximum €5000.00
      return NextResponse.json(
        { error: 'Maximum cadeau bedrag is €5000.00' },
        { status: 400 }
      );
    }

    // Check if recipient exists and has limits
    let existingUser = null;
    try {
      existingUser = await (prisma as any).user.findUnique({
        where: { email: recipientEmail },
      });
    } catch (dbError) {
      // Continue without user check if database error
    }

    if (existingUser && existingUser.stripeConnectAccountId) {
      const limitCheck = await checkUserLimits(existingUser.stripeConnectAccountId, amount);
      
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: limitCheck.reason || 'Ontvanger heeft de limiet bereikt.' },
          { status: 400 }
        );
      }
    }

    const platformFee = 99; // €0.99 in cents
    const totalAmount = amount + platformFee;

    // Create gift first
    const authenticationCode = generateVerificationCode();
    let gift;
    try {
      const giftData = {
        amount,
        currency,
        message: message || '',
        senderEmail,
        recipientEmail,
        authenticationCode,
        animationPreset: finalAnimationPreset,
        stripePaymentIntentId: null, // Will be updated when payment succeeds
      };
      
      gift = await prisma.gift.create({
        data: giftData,
      });
    } catch (dbError) {
      console.error('Database error creating gift:', dbError);
      return NextResponse.json(
        { error: 'Failed to create gift' },
        { status: 500 }
      );
    }

    // Create payment intent with giftId in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency.toLowerCase(),
      payment_method_types: ['ideal'], // Only allow iDEAL payments
      metadata: {
        type: 'gift',
        giftId: gift.id, // Add giftId to metadata
        senderEmail,
        recipientEmail,
        message: message || '',
        animationPreset: finalAnimationPreset,
        giftAmount: amount.toString(),
        platformFee: platformFee.toString(),
      },
    });

    // Update gift with payment intent ID
    await prisma.gift.update({
      where: { id: gift.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      giftId: gift.id,
      giftAmount: amount,
      platformFee: platformFee,
      totalAmount: totalAmount,
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Er is een fout opgetreden bij het aanmaken van de betaling';
    
    if (error instanceof Error) {
      if (error.message.includes('You must provide a customer')) {
        errorMessage = 'Betaalmethode niet ondersteund. Probeer een andere betaalmethode.';
      } else if (error.message.includes('Invalid amount')) {
        errorMessage = 'Ongeldig bedrag. Controleer het ingevoerde bedrag.';
      } else if (error.message.includes('Invalid currency')) {
        errorMessage = 'Ongeldige valuta. Alleen EUR wordt ondersteund.';
      } else {
        errorMessage = `Betaling fout: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
