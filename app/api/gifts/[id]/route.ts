import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: gift } = await supabaseAdmin
      .from('gifts')
      .select('id, amount, currency, message, senderEmail, recipientEmail, authenticationCode, plainTextCode, isClaimed, claimedAt, createdAt, stripeTransferId, animationPreset')
      .eq('id', params.id)
      .single();

    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    // Return plain text code for display, but keep authenticationCode for backward compatibility
    return NextResponse.json({
      ...gift,
      authenticationCode: gift.plainTextCode || gift.authenticationCode, // Return plain text for display
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch gift' },
      { status: 500 }
    );
  }
}
