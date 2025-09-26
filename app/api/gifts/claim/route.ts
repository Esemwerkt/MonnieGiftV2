import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

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

    if (!giftId || !email || !authenticationCode) {
      return NextResponse.json(
        { error: 'Cadeau ID, e-mail en authenticatiecode zijn vereist' },
        { status: 400 }
      );
    }

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


    let user = await (prisma as any).user.findUnique({
      where: { email },
    });

    let stripeAccountId = null;

    if (user) {
      stripeAccountId = user.stripeConnectAccountId;
      
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      const isV2Account = (account as any).configurations !== undefined;
      let chargesEnabled = false;
      let payoutsEnabled = false;
      
      if (isV2Account) {
        const merchantConfig = (account as any).configurations?.merchant;
        chargesEnabled = merchantConfig?.charges_enabled || false;
        payoutsEnabled = merchantConfig?.payouts_enabled || false;
      } else {
        chargesEnabled = account.charges_enabled || false;
        payoutsEnabled = account.payouts_enabled || false;
      }
      
      if (!chargesEnabled || !payoutsEnabled) {
        return NextResponse.json({
          needsOnboarding: true,
          accountId: stripeAccountId,
          giftId: giftId,
          email: email,
          message: 'Account setup required',
        });
      }
    } else {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'NL',
        email: email,
        capabilities: {
          transfers: { requested: true } // ONLY transfers - no card_payments
        },
        business_type: 'individual', // Required for individual accounts
        individual: {
          email: email,
          first_name: email.split('@')[0],
          last_name: 'User',
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

      user = await (prisma as any).user.create({
        data: {
          email,
          name: email.split('@')[0],
          stripeConnectAccountId: account.id,
          isVerified: true, // Auto-verify for minimal flow
        },
      });

      stripeAccountId = account.id;
      
      await prisma.gift.update({
        where: { id: giftId },
        data: {
          recipientEmail: email,
          stripeTransferId: `pending_${stripeAccountId}`, // Mark as pending
        },
      });

      return NextResponse.json({
        needsOnboarding: true,
        accountId: stripeAccountId,
        giftId: giftId,
        email: email,
        message: 'Account setup required',
      });
    }

    const transfer = await stripe.transfers.create({
      amount: gift.amount,
      currency: gift.currency,
      destination: stripeAccountId,
      metadata: {
        giftId: gift.id,
        recipientEmail: email,
      },
    });

    await prisma.gift.update({
      where: { id: giftId },
      data: {
        isClaimed: true,
        claimedAt: new Date(),
        stripeTransferId: transfer.id,
        recipientEmail: email, // Update recipient email
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cadeau succesvol opgehaald!',
      transferId: transfer.id,
    });
      } catch (error) {
        return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het ophalen van het cadeau',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}