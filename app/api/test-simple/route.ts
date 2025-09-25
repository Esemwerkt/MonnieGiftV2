import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'POST test endpoint working',
    timestamp: new Date().toISOString()
  });
}
