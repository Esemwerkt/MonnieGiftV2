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

    // Validate authentication code
    if (gift.authenticationCode !== authenticationCode) {
      return NextResponse.json(
        { error: 'Ongeldige authenticatiecode. Controleer of je de juiste code hebt ingevoerd.' },
        { status: 400 }
      );
    }

    // Validate email matches the gift's recipient email
    if (gift.recipientEmail.toLowerCase() !== email.toLowerCase()) {
      
      return NextResponse.json(
        { error: 'E-mailadres komt niet overeen met het cadeau. Controleer of je het juiste e-mailadres hebt ingevoerd.' },
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
      try {
        // Create Express account with OAuth flow
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'NL',
          email: email,
          capabilities: {
            transfers: { requested: true }
          },
        });

        // Create user record
        user = await (prisma as any).user.create({
          data: {
            email,
            name: email.split('@')[0],
            stripeConnectAccountId: account.id,
            isVerified: false, // Will be verified after our custom onboarding
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
      } catch (accountError) {
        console.error('Error creating Custom account:', accountError);
        return NextResponse.json(
          { 
            error: 'Failed to create account for gift claiming',
            details: accountError instanceof Error ? accountError.message : String(accountError)
          },
          { status: 500 }
        );
      }
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
    console.error('Error in claim API:', error);
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het ophalen van het cadeau',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}