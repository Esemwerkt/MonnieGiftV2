import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST'
  });
}
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, planId } = body;

    if (!email || !planId) {
      return NextResponse.json(
        { error: 'E-mail en plan ID zijn vereist' },
        { status: 400 }
      );
    }

    // Validate plan exists
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Ongeldig plan ID' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    // If downgrading to free plan, cancel existing subscription
    if (planId === 'free') {
      if (user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        } catch (error) {
          console.error('Error canceling subscription:', error);
        }
      }

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          subscriptionEndsAt: null,
          stripeSubscriptionId: null,
          subscriptionCurrentPeriodStart: null,
          subscriptionCurrentPeriodEnd: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Plan succesvol gewijzigd naar Gratis',
        user: {
          email: updatedUser.email,
          subscriptionPlan: updatedUser.subscriptionPlan,
          subscriptionStatus: updatedUser.subscriptionStatus,
        }
      });
    }

    // For paid plans, handle Stripe subscription
    let stripeCustomerId = user.stripeCustomerId;
    let stripeSubscriptionId = user.stripeSubscriptionId;

    // Create or get Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create Stripe price for the plan
    const price = await stripe.prices.create({
      unit_amount: plan.price,
      currency: plan.currency.toLowerCase(),
      recurring: { interval: 'month' },
      product_data: {
        name: `${plan.name} Plan`,
      },
      metadata: {
        description: plan.description,
      },
    });

    // Cancel existing subscription if any
    if (stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(stripeSubscriptionId);
      } catch (error) {
        console.error('Error canceling existing subscription:', error);
      }
    }

    // Create new subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });

    stripeSubscriptionId = subscription.id;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        subscriptionPlan: planId,
        subscriptionStatus: 'active',
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionCurrentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        subscriptionCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        subscriptionEndsAt: new Date((subscription as any).current_period_end * 1000),
      },
    });

    // Return client secret for payment confirmation
    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent;

    return NextResponse.json({
      success: true,
      message: `Plan succesvol gewijzigd naar ${plan.name}`,
      user: {
        email: updatedUser.email,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionCurrentPeriodEnd: updatedUser.subscriptionCurrentPeriodEnd,
      },
      clientSecret: paymentIntent?.client_secret,
      requiresPayment: true,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Abonnement bijwerken mislukt' },
      { status: 500 }
    );
  }
}
