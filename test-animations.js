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
  
  for (const preset of animationPresets) {
    console.log(`\n🎯 Testing preset: ${preset}`);
    
    try {
      // Create test gift data
      const testData = {
        amount: 100, // €1.00
        currency: 'eur',
        message: `Test gift for ${preset}`,
        senderEmail: 'test@example.com',
        recipientEmail: 'test@example.com',
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
        console.log('📊 Animation preset received by API:', result.animationPreset || 'Not returned');
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
