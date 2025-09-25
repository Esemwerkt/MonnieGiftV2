import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Check environment variables on Vercel
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  };

  // Test URL construction
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const testGiftId = 'test-gift-vercel';
  const giftUrl = `${baseUrl}/claim/${testGiftId}`;

  return NextResponse.json({
    message: 'Vercel environment debug',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    urlConstruction: {
      baseUrl,
      testGiftId,
      giftUrl,
    },
    deployment: {
      isVercel: !!process.env.VERCEL,
      environment: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
    }
  });
}
