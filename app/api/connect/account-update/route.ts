import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Retrieve account to check requirements
    const account = await stripe.accounts.retrieve(accountId);
    
    // Check if account needs updates
    const needsUpdate = account.requirements && 
                       account.requirements.currently_due && 
                       account.requirements.currently_due.length > 0;

    if (needsUpdate) {
      // Create account update link
      const updateLink = await stripe.accountLinks.create({
        account: accountId,
        type: 'account_update',
        refresh_url: `${process.env.NEXTAUTH_URL || 'https://vast-ties-unite.loca.lt'}/stripe/refresh`,
        return_url: `${process.env.NEXTAUTH_URL || 'https://vast-ties-unite.loca.lt'}/stripe/terug?account_id=${accountId}`,
      });

      return NextResponse.json({
        needsUpdate: true,
        requirements: account.requirements?.currently_due || [],
        updateUrl: updateLink.url,
        expiresAt: updateLink.expires_at,
      });
    }

    return NextResponse.json({
      needsUpdate: false,
      accountStatus: {
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
    });
  } catch (error) {
    console.error('Error checking account requirements:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check account requirements',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}