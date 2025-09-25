import { NextRequest, NextResponse } from 'next/server';
import { getUserLimits } from '@/lib/limits';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const email = searchParams.get('email'); // Keep for backward compatibility

    if (!accountId && !email) {
      return NextResponse.json(
        { error: 'Account ID or email is required' },
        { status: 400 }
      );
    }

    // If accountId is provided, use it; otherwise fall back to email (for backward compatibility)
    const identifier = accountId || email!;
    const limits = await getUserLimits(identifier);

    return NextResponse.json({
      success: true,
      limits: {
        currentAmount: limits.currentAmount / 100, // Convert to euros
        currentGiftCount: limits.currentGiftCount,
        remainingAmount: limits.remainingAmount / 100, // Convert to euros
        remainingGifts: limits.remainingGifts,
        monthlyLimit: limits.monthlyLimit / 100, // Convert to euros
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
