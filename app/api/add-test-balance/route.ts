import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

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
    const body = await request.json();
    const { amount = 10000 } = body; // Default to €100.00 (in cents)

    console.log('=== ADDING TEST BALANCE ===');
    console.log('Amount:', amount, 'cents');

    // Use a test card that bypasses pending balance
    const charge = await stripe.charges.create({
      amount: amount,
      currency: 'eur',
      source: 'tok_bypassPending', // Test token that bypasses pending balance
      description: 'Test balance for MonnieGift development',
    });

    console.log('Charge created:', {
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      balance_transaction: charge.balance_transaction
    });

    // Get current balance
    const balance = await stripe.balance.retrieve();
    
    console.log('Current balance:', {
      available: balance.available,
      pending: balance.pending,
      instant_available: balance.instant_available
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added €${(amount / 100).toFixed(2)} to your Stripe balance`,
      charge: {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        balance_transaction: charge.balance_transaction
      },
      balance: {
        available: balance.available,
        pending: balance.pending,
        instant_available: balance.instant_available
      }
    });

  } catch (error) {
    console.error('Error adding test balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add test balance',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
