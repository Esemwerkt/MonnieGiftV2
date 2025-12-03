import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateUniqueVerificationCode, hashAuthenticationCode } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to simulate a successful payment and create a gift
 * This bypasses Stripe and directly creates a gift with proper authentication codes
 * 
 * POST /api/test-payment
 * Body: {
 *   amount: number (in cents, e.g., 1000 for €10.00),
 *   currency?: string (default: 'eur'),
 *   message?: string,
 *   animationPreset?: string,
 *   senderEmail?: string (default: 'test@monniegift.com'),
 *   recipientEmail?: string (default: 'recipient@example.com')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      amount, 
      currency = 'eur', 
      message,
      animationPreset,
      senderEmail = 'test@monniegift.com',
      recipientEmail = 'recipient@example.com'
    } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required (in cents, e.g., 1000 for €10.00)' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum gift amount is €1.00 (100 cents)' },
        { status: 400 }
      );
    }

    if (amount > 500000) {
      return NextResponse.json(
        { error: 'Maximum gift amount is €5000.00 (500000 cents)' },
        { status: 400 }
      );
    }

    const platformFee = 99; // €0.99 in cents
    const finalAnimationPreset = animationPreset && animationPreset.trim() !== '' 
      ? animationPreset 
      : 'confettiRealistic';

    // Generate a fake payment intent ID for testing
    const fakePaymentIntentId = `pi_test_${crypto.randomBytes(12).toString('hex')}`;

    console.log('=== TEST PAYMENT: Creating gift ===');
    console.log('Amount:', amount);
    console.log('Currency:', currency);
    console.log('Message:', message);
    console.log('Animation Preset:', finalAnimationPreset);

    // Generate plain text code for display/email
    const plainTextCode = await generateUniqueVerificationCode(supabaseAdmin);
    console.log('Generated authentication code:', plainTextCode, 'Length:', plainTextCode.length);
    
    // Verify code length (should be 8 characters)
    if (plainTextCode.length !== 8) {
      console.error('WARNING: Authentication code length is not 8! Code:', plainTextCode, 'Length:', plainTextCode.length);
    }
    
    // Hash the code for secure storage
    const hashedCode = await hashAuthenticationCode(plainTextCode);

    const now = new Date().toISOString();
    const { data: gift, error: giftError } = await supabaseAdmin
      .from('gifts')
      .insert([{
        id: crypto.randomUUID(),
        amount: amount,
        currency: currency.toLowerCase(),
        message: message || '',
        senderEmail: senderEmail,
        recipientEmail: recipientEmail,
        authenticationCode: hashedCode, // Store hashed version for verification
        plainTextCode: plainTextCode, // Store plain text for display/email
        stripePaymentIntentId: fakePaymentIntentId,
        platformFee: platformFee,
        animationPreset: finalAnimationPreset,
        platformFeeAmount: platformFee,
        applicationFeeAmount: 0,
        stripeConnectAccountId: null,
        createdAt: now,
        updatedAt: now,
      }])
      .select()
      .single();

    if (giftError) {
      console.error('Error creating gift:', giftError);
      return NextResponse.json(
        { 
          error: 'Failed to create gift',
          details: giftError.message
        },
        { status: 500 }
      );
    }

    console.log('Gift created successfully:', gift.id);
    console.log('Plain text code:', plainTextCode);
    console.log('Hashed code stored:', hashedCode.substring(0, 20) + '...');

    // Generate claim URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://monniegift.nl';
    const claimUrl = `${baseUrl}/claim/${gift.id}?code=${plainTextCode}`;

    return NextResponse.json({
      success: true,
      message: 'Test gift created successfully!',
      gift: {
        id: gift.id,
        amount: gift.amount,
        currency: gift.currency,
        message: gift.message,
        authenticationCode: plainTextCode, // Return plain text for display
        animationPreset: gift.animationPreset,
        platformFee: platformFee,
        totalAmount: amount + platformFee,
      },
      claimUrl: claimUrl,
      paymentIntentId: fakePaymentIntentId,
      successUrl: `${baseUrl}/success?payment_intent=${fakePaymentIntentId}&amount=${amount}&currency=${currency}&message=${encodeURIComponent(message || '')}&animation_preset=${finalAnimationPreset}`,
      note: 'This is a test gift. Use the successUrl to see it in the success page, or use the claimUrl to test claiming.'
    });

  } catch (error) {
    console.error('Test payment error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test gift',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

