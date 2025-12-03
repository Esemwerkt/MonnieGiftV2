import { NextRequest, NextResponse } from 'next/server';
import { generateUniqueVerificationCode, hashAuthenticationCode } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to simulate payment authentication code generation
 * This simulates what happens in the Stripe webhook when a payment succeeds
 * 
 * GET /api/simulate-auth-code
 */
export async function GET(request: NextRequest) {
  try {
    // Generate the authentication code (same as webhook does)
    const plainTextCode = await generateUniqueVerificationCode(supabaseAdmin);
    
    // Hash the code (what gets stored in database)
    const hashedCode = await hashAuthenticationCode(plainTextCode);

    return NextResponse.json({
      success: true,
      authenticationCode: plainTextCode,
      codeLength: plainTextCode.length,
      format: '8-character hexadecimal (uppercase)',
      possibleCombinations: 4294967296, // 2^32
      hashedCode: hashedCode.substring(0, 30) + '...', // Truncated for display
      flow: {
        step1: 'Payment succeeds → Stripe webhook fires',
        step2: `Webhook generates code: ${plainTextCode}`,
        step3: 'Code is hashed (bcrypt) and stored in database',
        step4: 'Plain text code is sent to user via email',
        step5: 'User enters code to claim gift',
        step6: 'System verifies code by comparing hash'
      },
      note: 'This is a simulation. In production, this code would be generated when a payment succeeds via Stripe webhook.'
    });
  } catch (error) {
    console.error('Error simulating auth code:', error);
    return NextResponse.json(
      { 
        error: 'Failed to simulate auth code',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

