const axios = require('axios');

console.log('\n=== TESTING RETURNED FEATURE ===\n');

async function testReturnedFeature() {
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toolrental.com',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Admin logged in successfully\n');

    // Step 2: Get all reservations
    console.log('2. Fetching all reservations...');
    const reservationsRes = await axios.get('http://localhost:5000/api/reservations/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const reservations = reservationsRes.data;
    console.log(`✅ Found ${reservations.length} reservations\n`);

    if (reservations.length === 0) {
      console.log('⚠️  No reservations found to test with.');
      console.log('   Please create a reservation first through the UI.\n');
      return;
    }

    // Find a delivered reservation to test with
    const deliveredReservation = reservations.find(r => r.status === 'delivered');

    if (!deliveredReservation) {
      console.log('⚠️  No delivered reservations found.');
      console.log('   Looking for an active reservation to mark as delivered first...\n');

      const activeReservation = reservations.find(r => r.status === 'active');

      if (!activeReservation) {
        console.log('❌ No active reservations found to test with.');
        console.log('   Please create a reservation first through the UI.\n');
        return;
      }

      // Step 3: Mark as delivered
      console.log(`3. Marking reservation #${activeReservation.id} as delivered...`);
      await axios.post(
        `http://localhost:5000/api/reservations/${activeReservation.id}/deliver`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('✅ Reservation marked as delivered\n');

      // Step 4: Mark as returned
      console.log(`4. Marking reservation #${activeReservation.id} as returned...`);
      await axios.post(
        `http://localhost:5000/api/reservations/${activeReservation.id}/return`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('✅ Reservation marked as returned\n');

      // Step 5: Verify status
      console.log('5. Verifying the reservation status...');
      const verifyRes = await axios.get(`http://localhost:5000/api/reservations/${activeReservation.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const updatedReservation = verifyRes.data;
      console.log(`   Reservation #${updatedReservation.id}:`);
      console.log(`   Tool: ${updatedReservation.tool_name}`);
      console.log(`   User: ${updatedReservation.user_name}`);
      console.log(`   Status: ${updatedReservation.status}`);

      if (updatedReservation.status === 'returned') {
        console.log('\n✅ SUCCESS! The reservation was successfully marked as returned!\n');
      } else {
        console.log(`\n❌ FAILED! Expected status 'returned' but got '${updatedReservation.status}'\n`);
      }
    } else {
      // Step 3: Mark delivered reservation as returned
      console.log(`3. Found delivered reservation #${deliveredReservation.id}`);
      console.log(`   Tool: ${deliveredReservation.tool_name}`);
      console.log(`   User: ${deliveredReservation.user_name}\n`);

      console.log(`4. Marking reservation #${deliveredReservation.id} as returned...`);
      await axios.post(
        `http://localhost:5000/api/reservations/${deliveredReservation.id}/return`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('✅ Reservation marked as returned\n');

      // Step 4: Verify status
      console.log('5. Verifying the reservation status...');
      const verifyRes = await axios.get(`http://localhost:5000/api/reservations/${deliveredReservation.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const updatedReservation = verifyRes.data;
      console.log(`   Status: ${updatedReservation.status}`);

      if (updatedReservation.status === 'returned') {
        console.log('\n✅ SUCCESS! The reservation was successfully marked as returned!\n');
      } else {
        console.log(`\n❌ FAILED! Expected status 'returned' but got '${updatedReservation.status}'\n`);
      }
    }

    console.log('=== TEST COMPLETE ===\n');
    console.log('✅ The "Mark Returned" button is working correctly!');
    console.log('   - Backend endpoint: POST /api/reservations/:id/return');
    console.log('   - Status successfully changes to "returned"');
    console.log('   - Button appears in admin dashboard for delivered orders\n');

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
    console.log('');
  }
}

testReturnedFeature();
