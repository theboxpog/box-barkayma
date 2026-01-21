// Debug script to test Google Auth
const axios = require('axios');

console.log('\n=== DEBUGGING GOOGLE AUTH ===\n');

// Create a fake but valid-looking JWT token structure
const fakeGoogleToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI2NDYzMTA0MzQyODItZ2oxdXBsaG45cGFidWo5NWQ5Mm85ZnRmYTB2bm9oMmQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI2NDYzMTA0MzQyODItZ2oxdXBsaG45cGFidWo5NWQ5Mm85ZnRmYTB2bm9oMmQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTIzNTgxMzIxMzQ3MDAxMzQ4OTMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9waG90by5qcGciLCJnaXZlbl9uYW1lIjoiVGVzdCIsImZhbWlseV9uYW1lIjoiVXNlciIsImlhdCI6MTYzMjQ4MDAwMCwiZXhwIjoxNjMyNDgzNjAwfQ.fake_signature';

async function testGoogleAuth() {
  try {
    console.log('Testing Google Auth endpoint...');
    console.log('URL: http://localhost:5000/api/auth/google/google');
    console.log('');

    const response = await axios.post('http://localhost:5000/api/auth/google/google', {
      credential: fakeGoogleToken
    });

    console.log('✅ Success!');
    console.log('Response:', response.data);

  } catch (error) {
    if (error.response) {
      console.log('❌ Server responded with error');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);

      if (error.response.status === 400 && error.response.data.error === 'Invalid Google token') {
        console.log('\n✅ Endpoint is working!');
        console.log('   The token was decoded and validated (correctly rejected fake token)');
        console.log('\n🔍 This means the backend is working correctly.');
        console.log('   The issue is likely on the frontend or with Google OAuth settings.');
      }
    } else if (error.request) {
      console.log('❌ No response from server');
      console.log('   Is the backend running on port 5000?');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testGoogleAuth();
