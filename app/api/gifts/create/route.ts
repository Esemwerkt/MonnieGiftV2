import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { generateVerificationCode } from '@/lib/auth';
import { sendGiftEmail } from '@/lib/email';
import { checkUserLimits, LIMITS } from '@/lib/limits';

export async function POST(request: NextRequest) {
  try {
    console.log("=== GIFT CREATION API CALLED ===");
    const body = await request.json();
    console.log("Request body:", body);
    
    const { 
      amount, 
      currency = 'eur', 
      message, 
      senderEmail, 
      recipientEmail
    } = body;

    // Validate input
    if (!amount || !senderEmail || !recipientEmail) {
      return NextResponse.json(
        { error: 'Bedrag, verzender e-mail en ontvanger e-mail zijn vereist' },
        { status: 400 }
      );
    }

    // Check if recipient already has a Stripe account (existing user)
    // If they do, enforce limits immediately to prevent money loss
    const existingUser = await (prisma as any).user.findUnique({
      where: { email: recipientEmail },
    });

    if (existingUser && existingUser.stripeConnectAccountId) {
      // User has completed KYC and has Stripe account - check limits
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
    // If user doesn't exist or has no Stripe account, allow gift creation
    // Limits will be checked during claiming when they complete KYC

    // Generate authentication code
    const authenticationCode = generateVerificationCode();

    // Create gift record in database
    const gift = await prisma.gift.create({
      data: {
        amount,
        currency,
        message,
        senderEmail,
        recipientEmail,
        authenticationCode,
      },
    });

    // Calculate amounts according to SCT model
    const giftAmount = amount; // Gift amount in cents
    const platformFee = 99; // €0.99 platform fee in cents
    const totalAmount = giftAmount + platformFee; // Total amount to charge

    // Create PaymentIntent for SCT model (giver pays total, we transfer only gift amount)
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

    // Update gift with payment intent ID and fee information
    await prisma.gift.update({
      where: { id: gift.id },
      data: { 
        stripePaymentIntentId: paymentIntent.id,
        // Note: We'll add feeCents and totalCents fields to the schema later
      },
    });

    // Note: Email will be sent after successful payment via webhook
    // This ensures emails are only sent for paid gifts

    // Log gift creation
    console.log('Gift created successfully!');
    console.log('Gift ID:', gift.id);
    console.log('Authentication Code:', authenticationCode);
    console.log('Recipient Email:', recipientEmail);
    console.log('Claim URL:', `${process.env.NEXTAUTH_URL}/claim/${gift.id}`);
    
    console.log('Email will be sent after successful payment via webhook');

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
    console.error('Error creating gift:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Cadeau aanmaken mislukt',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
