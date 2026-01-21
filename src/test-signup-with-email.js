const axios = require('axios');

console.log('=== Testing Signup with Email ===\n');

const testUser = {
  name: 'Email Test User',
  email: 'yshayu0000@gmail.com', // Your email to receive the test
  phone_number: '1234567890',
  password: 'testpass123'
};

console.log('Attempting to signup with:');
console.log(`  Name: ${testUser.name}`);
console.log(`  Email: ${testUser.email}`);
console.log(`  Phone: ${testUser.phone_number}`);
console.log('\nNote: This will try to create an account. If the email already exists,');
console.log('it will fail (which is fine for testing email on new signups).\n');

axios.post('http://localhost:5000/api/auth/signup', testUser)
  .then(response => {
    console.log('✅ Signup successful!');
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Email: ${response.data.user.email}`);
    console.log('\n📧 Confirmation email should be sent to:', testUser.email);
    console.log('\nCheck your inbox and spam folder!');
    console.log('If you don\'t receive it, check the server logs for errors.\n');
  })
  .catch(error => {
    if (error.response) {
      console.log('❌ Signup failed:', error.response.data.error);
      if (error.response.data.error.includes('already exists')) {
        console.log('\nThis is expected if you already have an account.');
        console.log('Try with a different email to test the welcome email.\n');
      }
    } else {
      console.error('❌ Error:', error.message);
      console.log('\nMake sure the server is running on port 5000.\n');
    }
  });
