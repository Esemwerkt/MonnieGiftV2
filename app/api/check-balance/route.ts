import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECKING STRIPE BALANCE ===');

    // Get current balance
    const balance = await stripe.balance.retrieve();
    
    console.log('Current balance:', {
      available: balance.available,
      pending: balance.pending,
      instant_available: balance.instant_available
    });

    // Format balance for display
    const formatBalance = (balanceArray: any[]) => {
      if (!balanceArray || !Array.isArray(balanceArray)) return [];
      return balanceArray.map(b => ({
        amount: b.amount,
        currency: b.currency,
        amountFormatted: `€${(b.amount / 100).toFixed(2)}`,
        source_types: b.source_types
      }));
    };

    return NextResponse.json({
      success: true,
      balance: {
        available: formatBalance(balance.available),
        pending: formatBalance(balance.pending),
        instant_available: formatBalance(balance.instant_available || [])
      },
      summary: {
        totalAvailable: balance.available.reduce((sum, b) => sum + b.amount, 0),
        totalPending: balance.pending.reduce((sum, b) => sum + b.amount, 0),
        totalInstantAvailable: (balance.instant_available || []).reduce((sum, b) => sum + b.amount, 0),
        totalAvailableFormatted: `€${(balance.available.reduce((sum, b) => sum + b.amount, 0) / 100).toFixed(2)}`,
        totalPendingFormatted: `€${(balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100).toFixed(2)}`,
        totalInstantAvailableFormatted: `€${((balance.instant_available || []).reduce((sum, b) => sum + b.amount, 0) / 100).toFixed(2)}`
      }
    });

  } catch (error) {
    console.error('Error checking balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check balance',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
