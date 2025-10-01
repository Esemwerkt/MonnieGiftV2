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
    const { email, giftId } = body;

    if (!email || !giftId) {
      return NextResponse.json(
        { error: 'Email and gift ID are required' },
        { status: 400 }
      );
    }

    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'NL',
      email: email,
      business_type: 'individual', // Required when using individual parameter
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        product_description: 'Money gift platform - secure money transfers',
        url: process.env.NEXTAUTH_URL || 'https://monnie-gift-v222.vercel.app',
        mcc: '7399', // Computer Software Stores (appropriate for digital gift platform)
      },
      individual: {
        // Pre-fill as individual (natuurlijke persoon)
        first_name: '', // Will be filled during onboarding
        last_name: '', // Will be filled during onboarding
        email: email,
      },
      settings: {
        payouts: {
          statement_descriptor: 'MonnieGift',
        },
      },
    });

    // Create account link for Express onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL || 'https://monnie-gift-v222.vercel.app'}/stripe/terug?account_id=${account.id}&gift_id=${giftId}&email=${encodeURIComponent(email)}`,
      return_url: `${process.env.NEXTAUTH_URL || 'https://monnie-gift-v222.vercel.app'}/stripe/terug?account_id=${account.id}&gift_id=${giftId}&email=${encodeURIComponent(email)}`,
      type: 'account_onboarding',
    });

    // Store the account in our database
    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        email: email,
        stripeConnectAccountId: account.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, {
        onConflict: 'email'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (error: any) {
    console.error('Error creating Stripe account:', error);
    
    // Handle Stripe verification errors
    if (error.type === 'invalid_request_error' && error.code) {
      const verificationErrors = [
        'invalid_product_description_length',
        'invalid_product_description_url_match',
        'invalid_statement_descriptor_length',
        'invalid_statement_descriptor_business_mismatch',
        'invalid_statement_descriptor_denylisted',
        'invalid_statement_descriptor_prefix_mismatch',
        'invalid_statement_descriptor_prefix_denylisted',
        'invalid_company_name_denylisted',
        'invalid_business_profile_name_denylisted',
        'invalid_business_profile_name',
        'invalid_dob_age_under_minimum',
        'invalid_dob_age_over_maximum',
        'invalid_phone_number',
        'invalid_tax_id_format',
        'invalid_url_format',
        'invalid_url_denylisted',
        'invalid_url_website_inaccessible',
      ];
      
      if (verificationErrors.includes(error.code)) {
        return NextResponse.json(
          { 
            error: 'Account verification failed',
            code: error.code,
            message: 'Er is een probleem met de accountgegevens. Probeer het opnieuw.'
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create Stripe account',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
