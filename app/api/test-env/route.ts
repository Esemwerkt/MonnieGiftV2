import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Check which environment variables are available
  const envCheck = {
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING',
    STRIPE_WEBHOOK_SECRET_THIN: process.env.STRIPE_WEBHOOK_SECRET_THIN ? 'SET' : 'MISSING',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
  };

  return NextResponse.json({
    message: 'Environment variables check',
    environment: process.env.NODE_ENV,
    variables: envCheck,
    timestamp: new Date().toISOString()
  });
}
