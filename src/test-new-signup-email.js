const axios = require('axios');

console.log('=== Testing Signup with Email (New User) ===\n');

// Use a unique email with timestamp
const timestamp = Date.now();
const testUser = {
  name: 'New Test User',
  email: `test.${timestamp}@example.com`,
  phone_number: '9876543210',
  password: 'testpass123'
};

console.log('Attempting to signup with:');
console.log(`  Name: ${testUser.name}`);
console.log(`  Email: ${testUser.email}`);
console.log(`  Phone: ${testUser.phone_number}`);
console.log('\nThis will create a new account and should send a confirmation email.\n');

axios.post('http://localhost:5000/api/auth/signup', testUser)
  .then(response => {
    console.log('✅ Signup successful!');
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Email: ${response.data.user.email}`);
    console.log('\n📧 Check the server logs to see if email was sent successfully!');
    console.log('\nLook for messages like:');
    console.log('   "Signup confirmation email sent: <message-id>"');
    console.log('or');
    console.log('   "Failed to send signup confirmation email: <error>"\n');
  })
  .catch(error => {
    if (error.response) {
      console.log('❌ Signup failed:', error.response.data.error);
    } else {
      console.error('❌ Error:', error.message);
      console.log('\nMake sure the server is running on port 5000.\n');
    }
  });
