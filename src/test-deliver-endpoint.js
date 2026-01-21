const axios = require('axios');

async function testDeliverEndpoint() {
  console.log('Testing /deliver endpoint...\n');

  // First login as admin to get a token
  try {
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toolrental.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful! Token received.\n');

    // Get reservations to find one to test with
    console.log('2. Getting all reservations...');
    const reservationsResponse = await axios.get('http://localhost:5000/api/reservations/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const reservations = reservationsResponse.data;
    console.log(`Found ${reservations.length} reservations\n`);

    if (reservations.length === 0) {
      console.log('❌ No reservations to test with!');
      return;
    }

    // Show all reservations
    console.log('Available reservations:');
    reservations.forEach((r, i) => {
      console.log(`  ${i+1}. ID: ${r.id} - ${r.tool_name} - Status: ${r.status}`);
    });
    console.log('');

    // Find an active reservation
    const activeReservation = reservations.find(r => r.status === 'active');

    if (!activeReservation) {
      console.log('⚠️  No active reservations. Testing with first reservation anyway...');
      var testReservation = reservations[0];
    } else {
      var testReservation = activeReservation;
    }

    console.log(`3. Testing deliver endpoint with reservation ID: ${testReservation.id}`);
    console.log(`   Tool: ${testReservation.tool_name}`);
    console.log(`   Current Status: ${testReservation.status}\n`);

    // Test the deliver endpoint
    try {
      const deliverResponse = await axios.post(
        `http://localhost:5000/api/reservations/${testReservation.id}/deliver`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      console.log('✅ SUCCESS! Deliver endpoint works!');
      console.log('Response:', deliverResponse.data);
      console.log('');

      // Verify the status was updated
      console.log('4. Verifying reservation status was updated...');
      const verifyResponse = await axios.get('http://localhost:5000/api/reservations/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const updatedReservation = verifyResponse.data.find(r => r.id === testReservation.id);
      console.log(`Updated status: ${updatedReservation.status}`);

      if (updatedReservation.status === 'delivered') {
        console.log('✅ Status successfully changed to "delivered"!');
      } else {
        console.log('⚠️  Status was not changed to "delivered"');
      }

    } catch (error) {
      console.log('❌ FAILED! Deliver endpoint error:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDeliverEndpoint();
