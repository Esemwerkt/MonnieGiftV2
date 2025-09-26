import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
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
    
    const { 
      amount, 
      currency = 'eur', 
      message, 
      animationPreset,
      paymentIntentId
    } = body;
    
    // Ensure animationPreset is not undefined, null, or empty string
    const finalAnimationPreset = animationPreset && animationPreset.trim() !== '' ? animationPreset : 'confettiRealistic';

    if (!amount) {
      return NextResponse.json(
        { error: 'Bedrag is vereist' },
        { status: 400 }
      );
    }


    // Check if gift already exists for this payment intent (prevent duplicates)
    if (paymentIntentId) {
      try {
        const { data: existingGift } = await supabaseAdmin
          .from('gifts')
          .select('*')
          .eq('stripePaymentIntentId', paymentIntentId)
          .single();

        if (existingGift) {
          return NextResponse.json({
            success: true,
            giftId: existingGift.id,
            message: 'Gift already created for this payment',
          });
        }
      } catch (dbError) {
        console.error('Error checking for existing gift:', dbError);
      }
    }

    const authenticationCode = generateVerificationCode();

    let gift;
    const giftData = {
      amount,
      currency,
      message,
      authenticationCode,
      animationPreset: finalAnimationPreset,
      stripePaymentIntentId: paymentIntentId || null,
      stripeConnectAccountId: null, // No Stripe Connect in simplified flow
      platformFeeAmount: 99, // €0.99 in cents
      applicationFeeAmount: 0, 
    };
    
    try {
      const { data: newGift, error } = await supabaseAdmin
        .from('gifts')
        .insert([giftData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      gift = newGift;
    } catch (dbError) {
      console.error('Gift creation error:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to create gift',
          details: dbError instanceof Error ? dbError.message : String(dbError),
          giftData: giftData
        },
        { status: 500 }
      );
    }

    // Only create payment intent if this is not a fallback call (no paymentIntentId provided)
    if (!paymentIntentId) {
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
          message: message || '',
          animationPreset: finalAnimationPreset,
        },
      });

      await supabaseAdmin
        .from('gifts')
        .update({ stripePaymentIntentId: paymentIntent.id })
        .eq('id', gift.id);
    }


    

    return NextResponse.json({
      success: true,
      giftId: gift.id,
      paymentIntentId: paymentIntentId || null,
      clientSecret: null, // No client secret for fallback calls
      giftAmount: amount,
      platformFee: 99,
      totalAmount: amount + 99,
      animationPreset: gift.animationPreset, // Return the saved animation preset
      message: paymentIntentId ? 'Gift created successfully as fallback.' : 'Gift created successfully. Please complete payment to send the gift.',
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
