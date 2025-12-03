import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
import { sendGiftEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { giftId } = body;
    

    if (!giftId) {
      return NextResponse.json(
        { error: 'Gift ID is required' },
        { status: 400 }
      );
    }

    const { data: gift } = await supabase
      .from('gifts')
      .select('*, plainTextCode')
      .eq('id', giftId)
      .single();

    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    await sendGiftEmail({
      recipientEmail: gift.recipientEmail,
      giftId: gift.id,
      authenticationCode: gift.plainTextCode || gift.authenticationCode, // Use plain text code for email
      amount: gift.amount,
      message: gift.message || undefined,
      senderEmail: gift.senderEmail,
    });


    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      giftId: gift.id
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
