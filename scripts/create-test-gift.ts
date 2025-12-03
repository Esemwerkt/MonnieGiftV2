/**
 * Standalone script to create a test gift directly in the database
 * This doesn't require the server to be running
 * 
 * Usage: npx tsx scripts/create-test-gift.ts [amount] [message]
 * Example: npx tsx scripts/create-test-gift.ts 1000 "My test gift"
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn('⚠️  Error loading .env file:', result.error);
  }
} else {
  console.warn('⚠️  .env file not found, using environment variables from system');
}

// Verify required env vars are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in environment');
  console.error('   Make sure your .env file contains NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Now dynamically import modules that depend on environment variables
async function main() {
  const { supabaseAdmin } = await import('../lib/supabase');
  const { generateUniqueVerificationCode, hashAuthenticationCode } = await import('../lib/auth');

  async function createTestGift() {
  // Get arguments from command line
  const args = process.argv.slice(2);
  const amount = args[0] ? parseInt(args[0]) : 1000; // Default: €10.00
  const message = args[1] || 'Test gift message';
  const currency = 'eur';
  const animationPreset = 'confettiRealistic';
  const senderEmail = 'test@monniegift.com';
  const recipientEmail = 'recipient@example.com';

  if (isNaN(amount) || amount < 100) {
    console.error('❌ Error: Amount must be at least 100 cents (€1.00)');
    process.exit(1);
  }

  if (amount > 500000) {
    console.error('❌ Error: Amount cannot exceed 500000 cents (€5000.00)');
    process.exit(1);
  }

  const platformFee = 99; // €0.99 in cents
  const totalAmount = amount + platformFee;

  console.log('=== Creating Test Gift ===');
  console.log(`Amount: €${(amount / 100).toFixed(2)}`);
  console.log(`Platform Fee: €${(platformFee / 100).toFixed(2)}`);
  console.log(`Total: €${(totalAmount / 100).toFixed(2)}`);
  console.log(`Message: ${message}`);
  console.log('');

  try {
    // Generate plain text code for display/email
    console.log('Generating authentication code...');
    const plainTextCode = await generateUniqueVerificationCode(supabaseAdmin);
    console.log(`✅ Generated code: ${plainTextCode} (${plainTextCode.length} characters)`);
    
    // Hash the code for secure storage
    const hashedCode = await hashAuthenticationCode(plainTextCode);
    console.log('✅ Code hashed and ready for storage');
    console.log('');

    // Generate fake payment intent ID for testing
    const fakePaymentIntentId = `pi_test_${crypto.randomBytes(12).toString('hex')}`;

    // Create gift in database
    console.log('Creating gift in database...');
    const now = new Date().toISOString();
    const { data: gift, error: giftError } = await supabaseAdmin
      .from('gifts')
      .insert([{
        id: crypto.randomUUID(),
        amount: amount,
        currency: currency.toLowerCase(),
        message: message || '',
        senderEmail: senderEmail,
        recipientEmail: recipientEmail,
        authenticationCode: hashedCode, // Store hashed version for verification
        plainTextCode: plainTextCode, // Store plain text for display/email
        stripePaymentIntentId: fakePaymentIntentId,
        platformFee: platformFee,
        animationPreset: animationPreset,
        platformFeeAmount: platformFee,
        applicationFeeAmount: 0,
        stripeConnectAccountId: null,
        createdAt: now,
        updatedAt: now,
      }])
      .select()
      .single();

    if (giftError) {
      console.error('❌ Error creating gift:', giftError);
      process.exit(1);
    }

    console.log('✅ Gift created successfully!');
    console.log('');

    // Generate URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'https://monniegift.nl';
    const claimUrl = `${baseUrl}/claim/${gift.id}?code=${plainTextCode}`;
    const successUrl = `${baseUrl}/success?payment_intent=${fakePaymentIntentId}&amount=${amount}&currency=${currency}&message=${encodeURIComponent(message)}&animation_preset=${animationPreset}`;

    // Display results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 GIFT DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Gift ID: ${gift.id}`);
    console.log(`Amount: €${(gift.amount / 100).toFixed(2)}`);
    console.log(`Platform Fee: €${(platformFee / 100).toFixed(2)}`);
    console.log(`Total: €${(totalAmount / 100).toFixed(2)}`);
    console.log(`Message: ${message}`);
    console.log('');
    console.log('🔐 AUTHENTICATION CODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Code: ${plainTextCode}`);
    console.log('');
    console.log('🔗 LINKS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Success Page: ${successUrl}`);
    console.log(`Claim Page: ${claimUrl}`);
    console.log('');
    console.log('✅ Test gift created successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Visit the success URL to see the gift');
    console.log('3. Visit the claim URL to test the claiming flow');
    console.log('4. Use the authentication code to verify the gift');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

  // Run the script
  createTestGift()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

main();

