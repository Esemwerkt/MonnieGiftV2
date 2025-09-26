const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupWebhook() {
  try {
    // List existing webhooks
    const webhooks = await stripe.webhookEndpoints.list();
    console.log('Existing webhooks:', webhooks.data);
    
    // Check if our webhook already exists
    const existingWebhook = webhooks.data.find(
      webhook => webhook.url === 'https://monnie-gift-v222.vercel.app/api/webhooks/stripe'
    );
    
    if (existingWebhook) {
      console.log('✅ Webhook already exists:', existingWebhook.id);
      console.log('Events:', existingWebhook.enabled_events);
      console.log('Secret:', existingWebhook.secret);
    } else {
      console.log('❌ Webhook not found, creating new one...');
      
      // Create new webhook
      const webhook = await stripe.webhookEndpoints.create({
        url: 'https://monnie-gift-v222.vercel.app/api/webhooks/stripe',
        enabled_events: [
          'payment_intent.succeeded',
          'account.updated',
          'transfer.created',
          'transfer.reversed',
          'transfer.updated'
        ],
      });
      
      console.log('✅ Webhook created:', webhook.id);
      console.log('Secret:', webhook.secret);
      console.log('Add this secret to Vercel as STRIPE_WEBHOOK_SECRET');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupWebhook();
