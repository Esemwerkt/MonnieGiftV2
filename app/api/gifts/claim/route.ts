import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
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
    const { giftId, email, authenticationCode } = body;

    // Validate input
    if (!giftId || !email || !authenticationCode) {
      return NextResponse.json(
        { error: 'Cadeau ID, e-mail en authenticatiecode zijn vereist' },
        { status: 400 }
      );
    }

    // Find gift and verify authentication code
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      return NextResponse.json(
        { error: 'Cadeau niet gevonden' },
        { status: 404 }
      );
    }

    if (gift.isClaimed) {
      return NextResponse.json(
        { error: 'Cadeau is al opgehaald' },
        { status: 400 }
      );
    }

    if (gift.authenticationCode !== authenticationCode) {
      return NextResponse.json(
        { error: 'Ongeldige authenticatiecode' },
        { status: 400 }
      );
    }

    // For testing purposes, allow claiming even without payment
    // In production, this should check if payment was successful
    console.log('Gift details:', {
      id: gift.id,
      amount: gift.amount,
      stripePaymentIntentId: gift.stripePaymentIntentId,
      isClaimed: gift.isClaimed
    });

    // Check if user already exists
    let user = await (prisma as any).user.findUnique({
      where: { email },
    });

    let stripeAccountId = null;

    if (user) {
      // User exists, check if their Stripe account is ready
      stripeAccountId = user.stripeConnectAccountId;
      
      // Check if account is ready for transfers (works for both v1 and v2)
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      // Handle both v1 and v2 account formats
      const isV2Account = (account as any).configurations !== undefined;
      let chargesEnabled = false;
      let payoutsEnabled = false;
      
      if (isV2Account) {
        // Accounts v2 format
        const merchantConfig = (account as any).configurations?.merchant;
        chargesEnabled = merchantConfig?.charges_enabled || false;
        payoutsEnabled = merchantConfig?.payouts_enabled || false;
      } else {
        // Accounts v1 format
        chargesEnabled = account.charges_enabled || false;
        payoutsEnabled = account.payouts_enabled || false;
      }
      
      if (!chargesEnabled || !payoutsEnabled) {
        // Account not ready, redirect to onboarding
        return NextResponse.json({
          needsOnboarding: true,
          accountId: stripeAccountId,
          giftId: giftId,
          email: email,
          message: 'Account setup required',
        });
      }
    } else {
      // Create new user with Stripe Express account for ultra-minimal gift transfers
      // Following Stripe Connect Express troubleshooting guide
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'NL',
        email: email,
        capabilities: {
          transfers: { requested: true } // ONLY transfers - no card_payments
        },
        business_type: 'individual', // Required for individual accounts
        tos_acceptance: { service_agreement: 'recipient' }, // Required for recipient accounts
        // Prefill individual information to minimize user input
        individual: {
          email: email,
          first_name: email.split('@')[0],
          last_name: 'User',
          // Prefill with default values to minimize user input
          dob: {
            day: 1,
            month: 1,
            year: 1990, // Default, user can change during onboarding
          },
          address: {
            country: 'NL',
            line1: '', // Will be filled during onboarding
            city: '', // Will be filled during onboarding
            postal_code: '', // Will be filled during onboarding
          },
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
            },
          },
        },
        // Provide a default business profile to minimize user input
        business_profile: {
          url: 'https://monniegift.com', // Default platform URL
          mcc: '5999', // Miscellaneous retail - appropriate for gift platform
        },
        metadata: {
          onboarding_type: 'kyc_light',
          platform: 'monniegift',
          gift_amount: gift.amount.toString(),
          use_case: 'incidental_gift',
        },
      });

      // Create user record
      user = await (prisma as any).user.create({
        data: {
          email,
          name: email.split('@')[0],
          stripeConnectAccountId: account.id,
          isVerified: true, // Auto-verify for minimal flow
        },
      });

      stripeAccountId = account.id;
      
      // Store the pending claim for after onboarding
      // We'll use a special transfer ID to mark it as pending
      await prisma.gift.update({
        where: { id: giftId },
        data: {
          recipientEmail: email,
          stripeTransferId: `pending_${stripeAccountId}`, // Mark as pending
        },
      });

      // New accounts need onboarding before transfers
      return NextResponse.json({
        needsOnboarding: true,
        accountId: stripeAccountId,
        giftId: giftId,
        email: email,
        message: 'Account setup required',
      });
    }

    // Create transfer to user's Stripe account
    const transfer = await stripe.transfers.create({
      amount: gift.amount,
      currency: gift.currency,
      destination: stripeAccountId,
      metadata: {
        giftId: gift.id,
        recipientEmail: email,
      },
    });

    // Update gift as claimed
    await prisma.gift.update({
      where: { id: giftId },
      data: {
        isClaimed: true,
        claimedAt: new Date(),
        stripeTransferId: transfer.id,
        recipientEmail: email, // Update recipient email
      },
    });

    console.log('Gift claimed successfully:', {
      giftId: gift.id,
      amount: gift.amount,
      recipientEmail: email,
      transferId: transfer.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Cadeau succesvol opgehaald!',
      transferId: transfer.id,
    });
  } catch (error) {
    console.error('Error claiming gift:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het ophalen van het cadeau',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}