import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { checkUserLimits, LIMITS } from '@/lib/limits';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      amount, 
      currency = 'eur', 
      message, 
      animationPreset
    } = body;
    
    // Ensure animationPreset is not undefined, null, or empty string
    const finalAnimationPreset = animationPreset && animationPreset.trim() !== '' ? animationPreset : 'confettiRealistic';

    if (!amount) {
      return NextResponse.json(
        { error: 'Bedrag is vereist' },
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

    const platformFee = 99; // €0.99 in cents
    const totalAmount = amount + platformFee;

    // Create payment intent without Stripe Connect (platform keeps all until manual distribution)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency.toLowerCase(),
      payment_method_types: ['ideal'],
      metadata: {
        type: 'gift',
        message: message || '',
        animationPreset: finalAnimationPreset,
        giftAmount: amount.toString(),
        platformFee: platformFee.toString(),
        recipientAccountId: null, // No recipient email - will be collected during claim
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      giftAmount: amount,
      platformFee: platformFee,
      totalAmount: totalAmount,
      hasStripeConnect: false, // No Stripe Connect in simplified flow
      recipientAccountId: null,
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