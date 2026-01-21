const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// You'll need to replace this with an actual admin token
// To get a token, login as admin through the frontend and check localStorage
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

async function testAdminEndpoints() {
  console.log('=== TESTING ADMIN RESERVATION ENDPOINTS ===\n');

  try {
    // First, get all reservations to find one to test with
    console.log('1. Getting all reservations...');
    const reservationsResponse = await axios.get(`${API_URL}/reservations/admin/all`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    const reservations = reservationsResponse.data;
    console.log(`Found ${reservations.length} reservations\n`);

    if (reservations.length === 0) {
      console.log('No reservations found to test with!');
      return;
    }

    // Find an active reservation
    const activeReservation = reservations.find(r => r.status === 'active');

    if (!activeReservation) {
      console.log('No active reservations found to test with!');
      console.log('Available reservations:');
      reservations.forEach(r => {
        console.log(`  ID: ${r.id}, Status: ${r.status}, Tool: ${r.tool_name}`);
      });
      return;
    }

    console.log(`Testing with reservation ID: ${activeReservation.id}`);
    console.log(`  Tool: ${activeReservation.tool_name}`);
    console.log(`  Current Status: ${activeReservation.status}\n`);

    // Test marking as delivered
    console.log('2. Testing POST /reservations/:id/deliver...');
    try {
      const deliverResponse = await axios.post(
        `${API_URL}/reservations/${activeReservation.id}/deliver`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`
          }
        }
      );
      console.log('✅ Mark as delivered SUCCESS!');
      console.log('Response:', deliverResponse.data);
    } catch (error) {
      console.log('❌ Mark as delivered FAILED!');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n3. Testing POST /reservations/:id/cancel...');
    try {
      const cancelResponse = await axios.post(
        `${API_URL}/reservations/${activeReservation.id}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`
          }
        }
      );
      console.log('✅ Cancel SUCCESS!');
      console.log('Response:', cancelResponse.data);
    } catch (error) {
      console.log('❌ Cancel FAILED!');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n4. Testing PATCH /reservations/:id/status...');
    try {
      const statusResponse = await axios.patch(
        `${API_URL}/reservations/${activeReservation.id}/status`,
        { status: 'delivered' },
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`
          }
        }
      );
      console.log('✅ Update status SUCCESS!');
      console.log('Response:', statusResponse.data);
    } catch (error) {
      console.log('❌ Update status FAILED!');
      console.log('Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

console.log('IMPORTANT: You need to replace ADMIN_TOKEN with a real token!');
console.log('To get a token:');
console.log('1. Login as admin in the browser (admin@toolrental.com / admin123)');
console.log('2. Open browser console (F12)');
console.log('3. Type: localStorage.getItem("token")');
console.log('4. Copy the token and paste it in this file\n');

if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
  console.log('⚠️  Please set ADMIN_TOKEN before running this test!');
} else {
  testAdminEndpoints();
}
