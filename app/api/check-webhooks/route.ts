import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const webhooks = await stripe.webhookEndpoints.list();
    
    const webhookInfo = webhooks.data.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      enabled_events: webhook.enabled_events,
      status: webhook.status,
      secret: webhook.secret ? `${webhook.secret.substring(0, 10)}...` : 'No secret'
    }));
    
    return NextResponse.json({
      success: true,
      webhooks: webhookInfo,
      count: webhooks.data.length
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch webhooks',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
