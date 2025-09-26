import { NextRequest, NextResponse } from 'next/server';
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
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'preview') {
      return NextResponse.json({ message: 'Route not available during build' }, { status: 503 });
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from('users')
      .update({ isVerified: true })
      .eq('stripeConnectAccountId', accountId);

    return NextResponse.json({
      success: true,
      message: 'User verified successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    );
  }
}
