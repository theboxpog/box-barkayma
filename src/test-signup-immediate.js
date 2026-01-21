const axios = require('axios');

console.log('=== Testing Immediate Email on Signup ===\n');

// Use a unique email with timestamp
const timestamp = Date.now();
const testUser = {
  name: 'Immediate Test User',
  email: `immediatetest.${timestamp}@example.com`,
  phone_number: '5551234567',
  password: 'testpass123'
};

console.log('Creating account with:');
console.log(`  Email: ${testUser.email}`);
console.log(`  Name: ${testUser.name}`);
console.log('\nThis should send email IMMEDIATELY before responding...\n');

const startTime = Date.now();

axios.post('http://localhost:5000/api/auth/signup', testUser)
  .then(response => {
    const elapsed = Date.now() - startTime;
    console.log('✅ Signup completed!');
    console.log(`   Response time: ${elapsed}ms`);
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Email: ${response.data.user.email}`);
    console.log('\n📧 Check the server logs for:');
    console.log('   "✅ Signup confirmation email sent to: [email]"');
    console.log('\nIf the response took longer (300-1000ms), it means the email');
    console.log('was sent BEFORE responding (immediate sending is working!).\n');
  })
  .catch(error => {
    if (error.response) {
      console.log('❌ Signup failed:', error.response.data.error);
    } else {
      console.error('❌ Error:', error.message);
    }
  });
