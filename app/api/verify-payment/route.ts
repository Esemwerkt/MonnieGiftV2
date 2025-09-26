import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { rateLimit } from '../rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = rateLimit(`verify-payment-${clientIP}`, 5, 60000); // 5 requests per minute
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Validate payment intent ID format
    if (!paymentIntentId.startsWith('pi_') || paymentIntentId.length < 20) {
      return NextResponse.json(
        { error: 'Invalid payment intent ID format' },
        { status: 400 }
      );
    }

    // Verify the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if payment actually succeeded
    if (paymentIntent.status !== 'succeeded') {
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

    // Check if payment has required metadata
    if (!paymentIntent.metadata?.recipientEmail || !paymentIntent.metadata?.senderEmail) {
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
