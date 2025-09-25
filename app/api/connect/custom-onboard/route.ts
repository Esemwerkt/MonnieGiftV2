import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      accountId, 
      giftId, 
      email
    } = body;

    if (!accountId || !email) {
      return NextResponse.json(
        { error: 'Account ID and email are required' },
        { status: 400 }
      );
    }

    // Extract name from email for minimal onboarding
    const emailPrefix = email.split('@')[0];
    const firstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    const lastName = 'User';

    const newAccount = await stripe.accounts.create({
      type: 'express',
      country: 'NL',
      email: email, // User's email address
    
      business_type: 'individual', // Critical: ensures "Individual" onboarding
    
      capabilities: {
        transfers: { requested: true }, // Only enable payouts (no card payments)
      },
    
      individual: {
        email: email,
        first_name: firstName,
        last_name: lastName,
        dob: {
          day: 1,
          month: 1,
          year: 1990, // Replace with actual DOB if available
        },
        address: {
          country: 'NL',
          // Optionally prefill if known — otherwise omit these keys entirely
          // line1: 'Some street 1',
          // city: 'Amsterdam',
          // postal_code: '1012AB',
        },
        phone: '+31612345678', // Optional but recommended (replace with user’s phone)
      },
    
      settings: {
        payouts: {
          schedule: {
            interval: 'daily', // You can use 'manual', 'daily', 'weekly', 'monthly'
          },
        },
      },
    
      business_profile: {
        // These fields are required even for individuals
        url: 'https://monniegift.com', // Use your actual platform URL
        mcc: '5999', // MCC code for Miscellaneous Retail Stores
      },
    
      metadata: {
        onboarding_type: 'accounts_v2_gift_recipient',
        platform: 'monniegift',
        original_account: accountId,
        gift_id: giftId || '',
        country: 'NL',
        currency: 'EUR',
        gift_platform: 'true',
        recipient_type: 'gift_claimer',
        api_version: 'v2',
      },
    });
    

    // Skip Identity verification for KYC-light onboarding
    // Identity verification forces full KYC, which we want to avoid
    console.log('Skipping Identity verification for KYC-light onboarding');

    // Create account link for onboarding with minimal requirements
    const accountLink = await stripe.accountLinks.create({
      account: newAccount.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/onboard/custom?account_id=${newAccount.id}&gift_id=${giftId}&email=${encodeURIComponent(email)}&refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/claim/${giftId}?email=${encodeURIComponent(email)}&onboarding_complete=true&auto_claim=true&account_id=${newAccount.id}`,
      type: 'account_onboarding',
      // Try to minimize the onboarding flow
      collect: 'currently_due', // Only collect currently due information
    });

    // Create or update user in database with new account ID
    await (prisma as any).user.upsert({
      where: { email: email },
      update: {
        stripeConnectAccountId: newAccount.id,
        name: `${firstName} ${lastName}`,
        isVerified: false, // Will be set to true after identity verification
      },
      create: {
        email: email,
        name: `${firstName} ${lastName}`,
        stripeConnectAccountId: newAccount.id,
        isVerified: false,
      },
    });

    // Mark gift as pending transfer (will be completed after onboarding)
    if (giftId) {
      try {
        await prisma.gift.update({
          where: { id: giftId },
          data: {
            stripeTransferId: `pending_${newAccount.id}`,
          },
        });
        console.log(`Updated gift ${giftId} with pending transfer`);
      } catch (giftError) {
        console.log(`Gift ${giftId} not found, skipping update`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created, redirecting to KYC-light onboarding',
      accountId: newAccount.id,
      onboardingUrl: accountLink.url,
      needsOnboarding: true,
      hasIdentityVerification: false, // No Identity verification for KYC-light
    });

  } catch (error) {
    console.error('Error in custom onboarding:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to complete account setup',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
