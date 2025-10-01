import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

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
    const { giftId, userId, email } = body;

    if (!giftId || !userId || !email) {
      return NextResponse.json(
        { error: 'Cadeau ID, gebruiker ID en e-mail zijn vereist' },
        { status: 400 }
      );
    }

    // Get the gift
    const { data: gift } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (!gift) {
      return NextResponse.json(
        { error: 'Cadeau niet gevonden' },
        { status: 404 }
      );
    }

    if (gift.isClaimed) {
      return NextResponse.json(
        { error: 'Dit cadeau is al opgehaald' },
        { status: 400 }
      );
    }

    // Get the user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    if (!user.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'Gebruiker heeft geen Stripe Connect account' },
        { status: 400 }
      );
    }

    // Check if user has charges and payouts enabled
    let chargesEnabled = false;
    let payoutsEnabled = false;

    try {
      const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
      chargesEnabled = account.charges_enabled || false;
      payoutsEnabled = account.payouts_enabled || false;
    } catch (stripeError) {
      console.error('Error checking Stripe account:', stripeError);
      return NextResponse.json(
        { error: 'Er is een fout opgetreden bij het controleren van je Stripe account' },
        { status: 500 }
      );
    }

    if (!chargesEnabled || !payoutsEnabled) {
      return NextResponse.json(
        { 
          error: 'Je Stripe account is nog niet volledig ingesteld',
          chargesEnabled,
          payoutsEnabled
        },
        { status: 400 }
      );
    }

    // First, update the gift with recipient information BEFORE creating transfer
    console.log('Updating gift with recipient information...');
    const { error: updateError } = await supabaseAdmin
      .from('gifts')
      .update({
        recipientEmail: email, // Update with actual recipient email
        stripeConnectAccountId: user.stripeConnectAccountId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', gift.id);

    if (updateError) {
      console.error('Error updating gift with recipient info:', updateError);
      return NextResponse.json(
        { error: 'Er is een fout opgetreden bij het bijwerken van het cadeau' },
        { status: 500 }
      );
    }

    console.log('Gift updated with recipient info, creating transfer...');

    // Create transfer to user's Stripe account
    try {
      const transfer = await stripe.transfers.create({
        amount: gift.amount,
        currency: gift.currency,
        destination: user.stripeConnectAccountId,
        description: 'MonnieGift uitbetaling',
        metadata: {
          giftId: gift.id,
          type: 'gift_payout',
          recipientEmail: email,
        },
      });

      // Update gift as claimed with transfer ID
      await supabaseAdmin
        .from('gifts')
        .update({
          isClaimed: true,
          claimedAt: new Date().toISOString(),
          stripeTransferId: transfer.id,
        })
        .eq('id', gift.id);

      console.log(`Gift ${gift.id} successfully claimed by user ${user.id} with transfer ${transfer.id}`);

      return NextResponse.json({
        success: true,
        message: 'Cadeau succesvol opgehaald',
        transferId: transfer.id,
        amount: gift.amount,
        currency: gift.currency,
      });

    } catch (transferError) {
      console.error('Error creating transfer:', transferError);
      return NextResponse.json(
        { error: 'Er is een fout opgetreden bij het overmaken van het geld' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Gift claim error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het claimen van het cadeau' },
      { status: 500 }
    );
  }
}