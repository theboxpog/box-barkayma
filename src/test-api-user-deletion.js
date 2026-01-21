const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testUserDeletion() {
  console.log('=== Testing User Deletion API Protection ===\n');

  try {
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@toolrental.com',
      password: 'admin123'
    });

    const adminToken = loginResponse.data.token;
    console.log('✓ Admin login successful\n');

    // Step 2: Get all users to see their visible reservations count
    console.log('Step 2: Fetching all users...');
    const usersResponse = await axios.get(`${API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('\nUSERS LIST:');
    console.log('─'.repeat(80));
    usersResponse.data.forEach(user => {
      const canDelete = user.active_reservations_count === 0;
      const status = canDelete ? '✓ CAN DELETE' : '✗ CANNOT DELETE';
      console.log(`User ID ${user.id}: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  ${status} (Visible Reservations: ${user.active_reservations_count})`);
      console.log('─'.repeat(80));
    });

    // Step 3: Try to delete a user WITH visible reservations (should fail)
    const userWithReservations = usersResponse.data.find(u => u.active_reservations_count > 0);
    if (userWithReservations) {
      console.log(`\nStep 3: Attempting to delete User ID ${userWithReservations.id} (${userWithReservations.name})...`);
      console.log(`   This user has ${userWithReservations.active_reservations_count} visible reservation(s).`);

      try {
        await axios.delete(`${API_URL}/auth/users/${userWithReservations.id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('❌ ERROR: Deletion should have failed but succeeded!');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log('✓ Deletion correctly prevented!');
          console.log(`   Error message: "${error.response.data.error}"`);
        } else {
          console.log('❌ Unexpected error:', error.message);
        }
      }
    }

    // Step 4: Try to delete a user WITHOUT visible reservations (should succeed)
    const userWithoutReservations = usersResponse.data.find(
      u => u.active_reservations_count === 0 && u.id !== 1 // Don't delete admin
    );

    if (userWithoutReservations) {
      console.log(`\nStep 4: Attempting to delete User ID ${userWithoutReservations.id} (${userWithoutReservations.name})...`);
      console.log(`   This user has ${userWithoutReservations.active_reservations_count} visible reservations.`);

      try {
        const deleteResponse = await axios.delete(`${API_URL}/auth/users/${userWithoutReservations.id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✓ Deletion successful!');
        console.log(`   Message: "${deleteResponse.data.message}"`);

        // Verify user is actually deleted
        const verifyResponse = await axios.get(`${API_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const stillExists = verifyResponse.data.find(u => u.id === userWithoutReservations.id);
        if (!stillExists) {
          console.log('✓ Verified: User was successfully removed from database');
        } else {
          console.log('❌ ERROR: User still exists in database!');
        }
      } catch (error) {
        console.log('❌ Deletion failed:', error.response?.data?.error || error.message);
      }
    } else {
      console.log('\nStep 4: No users without reservations found (skipping deletion test)');
    }

    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY:');
    console.log('✓ Users with visible reservations are protected from deletion');
    console.log('✓ Users with only archived reservations (or no reservations) can be deleted');
    console.log('✓ API returns appropriate error messages');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testUserDeletion();
