// Test Google Auth Endpoint
const http = require('http');

console.log('\n=== TESTING GOOGLE AUTH ENDPOINT ===\n');

// Create a test JWT token (simulating what Google sends)
const testCredential = 'test-credential-token';

const postData = JSON.stringify({
  credential: testCredential
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/google/google',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing endpoint: POST http://localhost:5000/api/auth/google/google');
console.log('Sending test credential...\n');

const req = http.request(options, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
  console.log('');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }

    console.log('\n=== TEST COMPLETE ===');

    if (res.statusCode === 400 && data.includes('Invalid Google token')) {
      console.log('\n✅ Endpoint is working correctly!');
      console.log('   (It rejected our test token as expected)');
      console.log('\nThe issue might be:');
      console.log('1. Check browser console (F12) for network errors');
      console.log('2. Google token might not be decoded correctly');
      console.log('3. CORS issue (check browser console)');
    } else if (res.statusCode >= 500) {
      console.log('\n❌ Server error - check backend console for errors');
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed:', error.message);
  console.log('\nMake sure backend server is running:');
  console.log('   npm run server');
});

req.write(postData);
req.end();
