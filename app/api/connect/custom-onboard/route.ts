import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, giftId, email, firstName, lastName, iban, dateOfBirth } = body;

    if (!accountId || !email || !firstName || !lastName || !iban || !dateOfBirth) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Parse date of birth
    const dob = new Date(dateOfBirth);
    const day = dob.getDate();
    const month = dob.getMonth() + 1;
    const year = dob.getFullYear();

    // Update the Custom account with minimal required information
    const account = await stripe.accounts.update(accountId, {
      individual: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        dob: {
          day,
          month,
          year,
        },
      },
      external_account: {
        object: 'bank_account',
        country: 'NL',
        currency: 'eur',
        account_number: iban.replace(/\s/g, ''), // Remove spaces from IBAN
      },
    });

    // Mark user as verified since we collected the minimal info
    await (prisma as any).user.update({
      where: { stripeConnectAccountId: accountId },
      data: { 
        isVerified: true,
        identityVerifiedAt: new Date(),
      },
    });

    // Process any pending gifts for this user
    const pendingGifts = await prisma.gift.findMany({
      where: {
        recipientEmail: email,
        stripeTransferId: {
          startsWith: 'pending_',
        },
        isClaimed: false,
      },
    });

    // Process each pending gift
    for (const gift of pendingGifts) {
      try {
        const transfer = await stripe.transfers.create({
          amount: gift.amount, 
          currency: gift.currency,
          destination: accountId,
          description: 'MonnieGift uitbetaling',
          metadata: {
            giftId: gift.id,
            recipientEmail: email,
          },
        });
        
        await prisma.gift.update({
          where: { id: gift.id },
          data: {
            isClaimed: true,
            claimedAt: new Date(),
            stripeTransferId: transfer.id,
          },
        });
        
      } catch (transferError) {
        console.error(`Failed to transfer gift ${gift.id}:`, transferError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account setup completed successfully',
    });
  } catch (error) {
    console.error('Error in custom onboarding:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete onboarding',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}