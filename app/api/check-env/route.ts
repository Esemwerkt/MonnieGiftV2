import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: 'Environment variables check',
    environment: process.env.NODE_ENV,
    variables: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    },
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    expectedSecret: 'whsec_6XuhdfiHmm1W8LGzJapxo8KQNXvaJoJc',
    secretMatch: process.env.STRIPE_WEBHOOK_SECRET === 'whsec_6XuhdfiHmm1W8LGzJapxo8KQNXvaJoJc',
    timestamp: new Date().toISOString()
  });
}
