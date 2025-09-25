import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}

export async function POST(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'preview') {
      return NextResponse.json({ message: 'Route not available during build' }, { status: 503 });
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Import Prisma only when needed
    const { prisma } = await import('@/lib/prisma');

    // Update user as verified
    await prisma.user.update({
      where: { stripeConnectAccountId: accountId },
      data: { isVerified: true }
    });

    return NextResponse.json({
      success: true,
      message: 'User verified successfully'
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    );
  }
}
