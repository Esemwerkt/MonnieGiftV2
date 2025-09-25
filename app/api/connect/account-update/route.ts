import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, email, giftId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Verify this is an Express account
    const account = await stripe.accounts.retrieve(accountId);
    
    if (account.type !== 'express') {
      return NextResponse.json(
        { error: 'Account is not an Express account' },
        { status: 400 }
      );
    }

    // Check current requirements
    const requirements = account.requirements;
    const hasRequirements = requirements && requirements.currently_due && requirements.currently_due.length > 0;
    
    if (!hasRequirements) {
      return NextResponse.json({
        success: true,
        message: 'No additional verification needed',
        accountStatus: {
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: requirements?.currently_due || []
        }
      });
    }

    console.log(`Creating account update link for ${accountId}`);
    console.log(`Requirements currently due:`, requirements.currently_due);

    // Create account update link for additional verification
    const returnUrl = giftId && email 
      ? `${process.env.NEXTAUTH_URL}/claim/${giftId}?email=${encodeURIComponent(email)}&verification_complete=true&account_id=${accountId}`
      : `${process.env.NEXTAUTH_URL}/onboard/success?account_id=${accountId}&verification_complete=true`;
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/onboard/custom?account_id=${accountId}&email=${encodeURIComponent(email || '')}&refresh=true`,
      return_url: returnUrl,
      type: 'account_update', // This is key for additional verification
    });

    return NextResponse.json({
      success: true,
      message: 'Account update link created for additional verification',
      updateUrl: accountLink.url,
      requirements: requirements.currently_due,
      accountStatus: {
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        disabledReason: requirements.disabled_reason
      }
    });

  } catch (error) {
    console.error('Error creating account update link:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create account update link',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check account status and requirements
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

    // Retrieve account details
    const account = await stripe.accounts.retrieve(accountId);
    
    const requirements = account.requirements;
    const hasRequirements = requirements && requirements.currently_due && requirements.currently_due.length > 0;

    return NextResponse.json({
      accountId: account.id,
      type: account.type,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      country: account.country,
      email: account.email,
      requirements: {
        currentlyDue: requirements?.currently_due || [],
        eventuallyDue: requirements?.eventually_due || [],
        disabledReason: requirements?.disabled_reason,
        hasRequirements: hasRequirements
      },
      needsUpdate: hasRequirements
    });

  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}
