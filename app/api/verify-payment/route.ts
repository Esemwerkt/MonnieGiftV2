import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting temporarily disabled

    // Validate payment intent ID format
    if (!paymentIntentId.startsWith('pi_') || paymentIntentId.length < 20) {
      return NextResponse.json(
        { error: 'Invalid payment intent ID format' },
        { status: 400 }
      );
    }

    // Handle test payment intents (created via /api/test-payment)
    if (paymentIntentId.startsWith('pi_test_')) {
      console.log('Test payment intent detected, fetching gift from database');
      console.log('Looking for payment intent ID:', paymentIntentId);
      
      const { data: gift, error: giftError } = await supabaseAdmin
        .from('gifts')
        .select('*')
        .eq('stripePaymentIntentId', paymentIntentId)
        .single();

      if (giftError) {
        console.error('Error fetching test gift:', giftError);
        // Try to find by partial match in case of ID mismatch
        const { data: gifts } = await supabaseAdmin
          .from('gifts')
          .select('*')
          .like('stripePaymentIntentId', `%${paymentIntentId.substring(8)}%`)
          .limit(1);
        
        if (gifts && gifts.length > 0) {
          console.log('Found gift by partial match');
          const foundGift = gifts[0];
          return NextResponse.json({
            success: true,
            paymentIntent: {
              id: paymentIntentId,
              amount: foundGift.amount + (foundGift.platformFeeAmount || 99),
              currency: foundGift.currency,
              status: 'succeeded',
              metadata: {
                type: 'gift',
                message: foundGift.message || '',
                animationPreset: foundGift.animationPreset || 'confettiRealistic',
                giftAmount: foundGift.amount.toString(),
                platformFee: (foundGift.platformFeeAmount || 99).toString(),
              },
              created: Math.floor(new Date(foundGift.createdAt).getTime() / 1000),
            }
          });
        }
        
        return NextResponse.json(
          { 
            error: 'Test gift not found',
            details: giftError.message,
            paymentIntentId: paymentIntentId
          },
          { status: 404 }
        );
      }

      if (!gift) {
        console.error('Test gift not found for payment intent:', paymentIntentId);
        return NextResponse.json(
          { 
            error: 'Test gift not found',
            paymentIntentId: paymentIntentId
          },
          { status: 404 }
        );
      }

      console.log('Test gift found:', gift.id);

      // Return mock payment intent data for test payments
      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntentId,
          amount: gift.amount + (gift.platformFeeAmount || 99),
          currency: gift.currency,
          status: 'succeeded',
          metadata: {
            type: 'gift',
            message: gift.message || '',
            animationPreset: gift.animationPreset || 'confettiRealistic',
            giftAmount: gift.amount.toString(),
            platformFee: (gift.platformFeeAmount || 99).toString(),
          },
          created: Math.floor(new Date(gift.createdAt).getTime() / 1000),
        }
      });
    }

    // Verify the payment intent with Stripe
    console.log('Retrieving payment intent:', paymentIntentId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Payment intent status:', paymentIntent.status);
    console.log('Payment intent amount:', paymentIntent.amount);
    console.log('Payment intent metadata:', paymentIntent.metadata);

    // Check if payment actually succeeded
    if (paymentIntent.status !== 'succeeded') {
      console.log('Payment not succeeded, status:', paymentIntent.status);
      return NextResponse.json(
        { 
          error: 'Payment not completed',
          status: paymentIntent.status 
        },
        { status: 400 }
      );
    }

    // Additional security checks
    const now = Date.now();
    const paymentCreated = paymentIntent.created * 1000; // Convert to milliseconds
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Check if payment is not too old
    if (now - paymentCreated > maxAge) {
      return NextResponse.json(
        { 
          error: 'Payment too old',
          age: Math.floor((now - paymentCreated) / (60 * 1000)) // minutes
        },
        { status: 400 }
      );
    }

    // Check if payment has required metadata (simplified flow - no email requirements)
    if (!paymentIntent.metadata?.giftAmount) {
      return NextResponse.json(
        { 
          error: 'Invalid payment metadata',
          message: 'Payment missing required gift information'
        },
        { status: 400 }
      );
    }

    // Return the verified payment data (not from URL parameters)
    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
