import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'E-mailadres is vereist' },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, stripeConnectAccountId, createdAt')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({
        status: 'new_user',
        message: 'E-mailadres niet gevonden - nieuwe gebruiker'
      });
    }

    if (user.stripeConnectAccountId) {
      return NextResponse.json({
        status: 'existing_stripe_user',
        user: user,
        message: 'Gebruiker heeft Stripe Connect - kan direct claimen'
      });
    }

    return NextResponse.json({
      status: 'existing_user_no_stripe',
      user: user,
      message: 'Gebruiker bestaat maar heeft geen Stripe Connect'
    });

  } catch (error) {
    console.error('User status check error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het controleren van je account' },
      { status: 500 }
    );
  }
}