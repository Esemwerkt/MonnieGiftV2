import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await (prisma as any).user.findUnique({
      where: { email },
      select: {
        stripeConnectAccountId: true,
        isVerified: true,
      },
    });

    if (!user || !user.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      accountId: user.stripeConnectAccountId,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error('Error getting account:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get account',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
