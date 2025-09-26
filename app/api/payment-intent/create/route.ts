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

    // Check if recipient exists and has Stripe Connect account
    let existingUser = null;
    try {
      existingUser = await (prisma as any).user.findUnique({
        where: { email: recipientEmail },
      });
    } catch (dbError) {
      // Continue without user check if database error
    }

    const platformFee = 99; // €0.99 in cents
    const totalAmount = amount + platformFee;

    // Create payment intent with Stripe Connect application fee
    let paymentIntent;
    
    if (existingUser && existingUser.stripeConnectAccountId) {
      // Recipient has Stripe Connect account - use application fee
      const limitCheck = await checkUserLimits(existingUser.stripeConnectAccountId, amount);
      
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: limitCheck.reason || 'Ontvanger heeft de limiet bereikt.' },
          { status: 400 }
        );
      }

      paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: currency.toLowerCase(),
        payment_method_types: ['ideal'],
        application_fee_amount: platformFee, // Platform keeps €0.99
        transfer_data: {
          destination: existingUser.stripeConnectAccountId, // Recipient gets €8.00
        },
        metadata: {
          type: 'gift',
          senderEmail,
          recipientEmail,
          message: message || '',
          animationPreset: finalAnimationPreset,
          giftAmount: amount.toString(),
          platformFee: platformFee.toString(),
          recipientAccountId: existingUser.stripeConnectAccountId,
        },
      });
    } else {
      // Recipient doesn't have Stripe Connect account - platform keeps all
      paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: currency.toLowerCase(),
        payment_method_types: ['ideal'],
        metadata: {
          type: 'gift',
          senderEmail,
          recipientEmail,
          message: message || '',
          animationPreset: finalAnimationPreset,
          giftAmount: amount.toString(),
          platformFee: platformFee.toString(),
          recipientAccountId: null, // No Stripe Connect account
        },
      });
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      giftAmount: amount,
      platformFee: platformFee,
      totalAmount: totalAmount,
      hasStripeConnect: !!(existingUser && existingUser.stripeConnectAccountId),
      recipientAccountId: existingUser?.stripeConnectAccountId || null,
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
