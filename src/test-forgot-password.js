const axios = require('axios');

console.log('=== Testing Forgot Password Feature ===\n');

const testEmail = 'yshayu0000@gmail.com';

console.log(`Requesting password reset for: ${testEmail}`);
console.log('This should send a password reset email...\n');

axios.post('http://localhost:5000/api/auth/forgot-password', { email: testEmail })
  .then(response => {
    console.log('✅ Request successful!');
    console.log(`   Message: ${response.data.message}`);
    console.log('\n📧 CHECK YOUR EMAIL at yshayu0000@gmail.com');
    console.log('   Subject: "Password Reset Request - Tool Rental"');
    console.log('   The email contains a link to reset your password');
    console.log('   Link expires in 1 hour\n');
    console.log('Also check your SPAM/JUNK folder!\n');
  })
  .catch(error => {
    if (error.response) {
      console.log('❌ Request failed:', error.response.data.error);
    } else {
      console.error('❌ Error:', error.message);
    }
  });
