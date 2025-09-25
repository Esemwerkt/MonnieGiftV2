import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  console.log('🧪 Webhook test endpoint called!');
  console.log('Signature present:', !!signature);
  console.log('Body length:', body.length);
  console.log('Body preview:', body.substring(0, 200));
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  return NextResponse.json({
    success: true,
    message: 'Webhook test endpoint working',
    timestamp: new Date().toISOString(),
    signature: !!signature,
    bodyLength: body.length
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint - use POST to test',
    timestamp: new Date().toISOString()
  });
}
