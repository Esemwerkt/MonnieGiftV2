// Test script to create gifts with different animation presets
// Run this in your browser console on the gift creation page

const animationPresets = [
  'confettiRealistic',
  'fireworks', 
  'customShapes',
  'schoolPride'
];

async function testAnimationPresets() {
  console.log('🧪 Starting animation preset tests...');
  
  for (let i = 0; i < animationPresets.length; i++) {
    const preset = animationPresets[i];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    console.log(`\n🎯 Testing preset ${i + 1}/${animationPresets.length}: ${preset}`);
    
    try {
      // Create unique test gift data for each preset
      const testData = {
        amount: 100 + (i * 50), // €1.00, €1.50, €2.00, €2.50
        currency: 'eur',
        message: `TEST-${preset.toUpperCase()}-${timestamp}`,
        senderEmail: `test-${preset}@example.com`,
        recipientEmail: `recipient-${preset}@example.com`,
        animationPreset: preset
      };
      
      console.log('📤 Sending data:', testData);
      
      // Send to API
      const response = await fetch('/api/gifts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Success! Gift created:', result.giftId);
        console.log('📊 Animation preset sent:', preset);
        console.log('📊 Animation preset saved to DB:', result.animationPreset || 'Not returned');
        console.log('💰 Amount:', `€${(testData.amount / 100).toFixed(2)}`);
        console.log('📧 Sender:', testData.senderEmail);
        console.log('📧 Recipient:', testData.recipientEmail);
        console.log('💬 Message:', testData.message);
        
        // Check if the saved value matches what we sent
        if (result.animationPreset === preset) {
          console.log('🎉 PERFECT! Animation preset saved correctly!');
        } else {
          console.log('⚠️  MISMATCH! Expected:', preset, 'Got:', result.animationPreset);
        }
      } else {
        console.error('❌ Failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Error testing', preset, ':', error);
    }
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 All tests completed! Check your database for results.');
}

// Run the tests
testAnimationPresets();
