import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, giftId, email } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Create Express account first
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
        url: process.env.NEXTAUTH_URL || 'https://monnie-gift-v2-rydb.vercel.app',
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
      refresh_url: `${process.env.NEXTAUTH_URL || 'https://monnie-gift-v2-rydb.vercel.app'}/stripe/terug?account_id=${account.id}&gift_id=${giftId}&email=${encodeURIComponent(email)}`,
      return_url: `${process.env.NEXTAUTH_URL || 'https://monnie-gift-v2-rydb.vercel.app'}/stripe/terug?account_id=${account.id}&gift_id=${giftId}&email=${encodeURIComponent(email)}`,
      type: 'account_onboarding',
    });

    const link = accountLink.url;

    return NextResponse.json({
      success: true,
      onboardingUrl: link,
    });
  } catch (error: any) {
    console.error('Error creating onboarding link:', error);
    
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
        'invalid_url_website_business_information_mismatch',
        'invalid_url_website_incomplete',
        'invalid_url_website_other',
        'missing_url_web_presence_detected'
      ];
      
      if (verificationErrors.includes(error.code)) {
        return NextResponse.json(
          { 
            error: 'Account verification failed',
            code: error.code,
            message: 'Er is een probleem met de account verificatie. Probeer het opnieuw of neem contact op met de ondersteuning.',
            details: error.message
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create onboarding link',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}