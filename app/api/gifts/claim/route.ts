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
      // Create Express account according to playbook
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'NL',
        business_type: 'individual',
        email: email,
        capabilities: { 
          transfers: { requested: true } 
        },
        tos_acceptance: { 
          service_agreement: 'recipient' 
        },
        metadata: {
          onboarding_type: 'express_recipient',
          platform: 'monniegift',
          gift_amount: gift.amount.toString(),
          use_case: 'gift_recipient',
        },
      });

      // Create user record
      user = await (prisma as any).user.create({
        data: {
          email,
          name: email.split('@')[0],
          stripeConnectAccountId: account.id,
          isVerified: false, // Will be verified after onboarding
        },
      });

      stripeAccountId = account.id;
      
      // Mark gift as pending transfer
      await prisma.gift.update({
        where: { id: giftId },
        data: {
          recipientEmail: email,
          stripeTransferId: `pending_${stripeAccountId}`,
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
        recipientEmail: email,
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