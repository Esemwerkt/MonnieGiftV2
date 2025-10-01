import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { giftId, email, authCode } = body;

    if (!giftId || !email || !authCode) {
      return NextResponse.json(
        { error: 'Gift ID, email, and auth code are required' },
        { status: 400 }
      );
    }

    console.log('Verifying auth code:', { giftId, email, authCode });

    // Get the gift and verify the auth code
    const { data: gift, error: giftError } = await supabaseAdmin
      .from('gifts')
      .select('id, authenticationCode, recipientEmail, isClaimed')
      .eq('id', giftId)
      .single();

    if (giftError || !gift) {
      console.error('Gift not found:', giftError);
      return NextResponse.json(
        { error: 'Cadeau niet gevonden' },
        { status: 404 }
      );
    }

    // Check if gift is already claimed
    if (gift.isClaimed) {
      return NextResponse.json(
        { error: 'Dit cadeau is al opgehaald' },
        { status: 400 }
      );
    }

    // Verify the auth code
    if (gift.authenticationCode !== authCode.toUpperCase()) {
      console.log('Auth code mismatch:', { 
        provided: authCode.toUpperCase(), 
        expected: gift.authenticationCode 
      });
      return NextResponse.json(
        { error: 'Ongeldige authenticatiecode' },
        { status: 400 }
      );
    }

    // Check if the email matches the recipient email (if it's not pending)
    if (gift.recipientEmail && gift.recipientEmail !== 'pending@example.com' && gift.recipientEmail !== email) {
      console.log('Email mismatch:', { 
        provided: email, 
        expected: gift.recipientEmail 
      });
      return NextResponse.json(
        { error: 'E-mailadres komt niet overeen met het cadeau' },
        { status: 400 }
      );
    }

    console.log('Auth verification successful for gift:', giftId);

    return NextResponse.json({
      valid: true,
      message: 'Authenticatie succesvol',
      gift: {
        id: gift.id,
        recipientEmail: gift.recipientEmail,
        isClaimed: gift.isClaimed
      }
    });

  } catch (error) {
    console.error('Error verifying auth code:', error);
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het verifiëren',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
