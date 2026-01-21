const axios = require('axios');

console.log('\n=== TESTING USERS ENDPOINT ===\n');

async function testUsersEndpoint() {
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toolrental.com',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Login successful!');
    console.log('   Token:', token.substring(0, 20) + '...\n');

    // Step 2: Get all users
    console.log('2. Fetching all users...');
    const usersRes = await axios.get('http://localhost:5000/api/auth/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Users endpoint working!');
    console.log(`   Total users: ${usersRes.data.length}\n`);

    console.log('Users list:');
    usersRes.data.forEach((user, index) => {
      console.log(`\n${index + 1}. User #${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Joined: ${new Date(user.created_at).toLocaleDateString()}`);
    });

    console.log('\n=== TEST COMPLETE ===\n');
    console.log('✅ The users management feature is working correctly!');
    console.log('   You can now access it at: http://localhost:3000/admin/users\n');

  } catch (error) {
    console.log('❌ Error occurred:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('   No response from server');
      console.log('   Is the backend running on port 5000?');
    } else {
      console.log('   Error:', error.message);
    }
  }
}

testUsersEndpoint();
