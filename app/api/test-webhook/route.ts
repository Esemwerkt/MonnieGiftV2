import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendGiftEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint - use POST to test email sending',
    method: 'POST'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail = 'test@example.com' } = body;

    console.log('=== TESTING EMAIL SENDING ===');
    console.log('Test email:', testEmail);

    // Test email sending
    const emailResult = await sendGiftEmail({
      recipientEmail: testEmail,
      giftId: 'test-gift-123',
      authenticationCode: 'TEST123',
      amount: 1000, // €10.00
      message: 'This is a test email from MonnieGift',
      senderEmail: 'test-sender@example.com',
    });

    console.log('✅ Test email sent successfully:', emailResult);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Test email failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
