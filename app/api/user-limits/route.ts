import { NextRequest, NextResponse } from 'next/server';
import { getUserLimits } from '@/lib/limits';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const email = searchParams.get('email');

    if (!accountId && !email) {
      return NextResponse.json(
        { error: 'Account ID or email is required' },
        { status: 400 }
      );
    }

    const identifier = accountId || email!;
    const limits = await getUserLimits(identifier);

    return NextResponse.json({
      success: true,
      limits: {
        currentAmount: limits.currentAmount / 100,
        currentGiftCount: limits.currentGiftCount,
        remainingAmount: limits.remainingAmount / 100,
        remainingGifts: limits.remainingGifts,
        monthlyLimit: limits.monthlyLimit / 100,
        monthlyGiftLimit: limits.monthlyGiftLimit,
      },
    });
  } catch (error) {
    console.error('Error getting user limits:', error);
    return NextResponse.json(
      { error: 'Failed to get user limits' },
      { status: 500 }
    );
  }
}
