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
      .select('id, amount, currency, message, senderEmail, recipientEmail, authenticationCode, isClaimed, claimedAt, createdAt, stripeTransferId, animationPreset')
      .eq('id', params.id)
      .single();

    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(gift);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch gift' },
      { status: 500 }
    );
  }
}
