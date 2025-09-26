import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('=== TEST WEBHOOK ENDPOINT CALLED ===');
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  const body = await request.text();
  console.log('Body length:', body.length);
  console.log('Body preview:', body.substring(0, 200));
  
  return NextResponse.json({
    success: true,
    message: 'Test webhook endpoint working',
    timestamp: new Date().toISOString(),
    bodyLength: body.length,
    hasSignature: !!request.headers.get('stripe-signature')
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint - use POST to test',
    timestamp: new Date().toISOString()
  });
}
