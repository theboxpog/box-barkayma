// Test Google Authentication Setup
// Run this with: node test-google-auth.js

const http = require('http');

console.log('\n=== TESTING GOOGLE AUTH SETUP ===\n');

// Test 1: Check if backend is running
console.log('Test 1: Checking if backend server is running...');
const healthCheck = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Backend server is running on port 5000');
      console.log(`   Response: ${data}\n`);
    } else {
      console.log(`❌ Backend returned status ${res.statusCode}`);
    }
  });
});

healthCheck.on('error', (err) => {
  console.log('❌ Backend server is NOT running!');
  console.log('   Error:', err.message);
  console.log('\n⚠️  SOLUTION: Start the backend server with:');
  console.log('   cd c:\\Users\\yshay\\OneDrive\\שולחן העבודה\\web_project\\tool-rental-app');
  console.log('   npm run server\n');
});

healthCheck.end();

// Test 2: Check environment variables
setTimeout(() => {
  console.log('\nTest 2: Checking environment variables...');
  require('dotenv').config();

  const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here';
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret-here';

  if (hasGoogleId) {
    console.log('✅ GOOGLE_CLIENT_ID is set');
    console.log(`   Value: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
  } else {
    console.log('❌ GOOGLE_CLIENT_ID is not set or using placeholder');
  }

  if (hasGoogleSecret) {
    console.log('✅ GOOGLE_CLIENT_SECRET is set');
    console.log(`   Value: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 15)}...`);
  } else {
    console.log('❌ GOOGLE_CLIENT_SECRET is not set or using placeholder');
  }

  console.log('\n=== SUMMARY ===');
  if (hasGoogleId && hasGoogleSecret) {
    console.log('✅ Environment variables are configured correctly');
    console.log('\nNext steps:');
    console.log('1. Make sure backend is running: npm run server');
    console.log('2. Make sure frontend is running: npm start');
    console.log('3. Try Google Sign In at http://localhost:3000/login');
  } else {
    console.log('❌ Environment variables need to be configured');
    console.log('\nUpdate your .env file with:');
    console.log('GOOGLE_CLIENT_ID=your-google-client-id-here');
    console.log('GOOGLE_CLIENT_SECRET=your-google-client-secret-here');
  }
  console.log('\n');
}, 1000);
