/**
 * Simulation script to generate authentication codes without making actual payments
 * This simulates what happens in the Stripe webhook when a payment succeeds
 */

import { generateUniqueVerificationCode, hashAuthenticationCode } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';

async function simulatePaymentAuth() {
  console.log('=== Simulating Payment Authentication Code Generation ===\n');

  try {
    // Step 1: Generate the authentication code (same as webhook does)
    console.log('Step 1: Generating unique verification code...');
    const plainTextCode = await generateUniqueVerificationCode(supabaseAdmin);
    console.log(`✅ Generated authentication code: ${plainTextCode}`);
    console.log(`   Code length: ${plainTextCode.length} characters`);
    console.log(`   Format: 8-character hexadecimal (uppercase)\n`);

    // Step 2: Hash the code (what gets stored in database)
    console.log('Step 2: Hashing code for secure storage...');
    const hashedCode = await hashAuthenticationCode(plainTextCode);
    console.log(`✅ Hashed code: ${hashedCode.substring(0, 20)}...`);
    console.log(`   (Full hash stored in database, truncated for display)\n`);

    // Step 3: Show what the user would receive
    console.log('Step 3: What the user would receive:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Authentication Code: ${plainTextCode}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Step 4: Show the flow
    console.log('Payment Flow Summary:');
    console.log('  1. Payment succeeds → Stripe webhook fires');
    console.log('  2. Webhook generates code:', plainTextCode);
    console.log('  3. Code is hashed and stored in database');
    console.log('  4. Plain text code is sent to user via email');
    console.log('  5. User enters code to claim gift');
    console.log('  6. System verifies code by comparing hash\n');

    return {
      plainTextCode,
      hashedCode,
    };
  } catch (error) {
    console.error('❌ Error simulating payment auth:', error);
    throw error;
  }
}

// Run the simulation
if (require.main === module) {
  simulatePaymentAuth()
    .then((result) => {
      console.log('✅ Simulation complete!');
      console.log(`\nGenerated code: ${result.plainTextCode}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Simulation failed:', error);
      process.exit(1);
    });
}

export { simulatePaymentAuth };

