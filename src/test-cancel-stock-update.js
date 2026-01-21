const axios = require('axios');

async function testCancelAndStockUpdate() {
  console.log('=== TESTING CANCEL RESERVATION & STOCK UPDATE ===\n');

  try {
    // Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toolrental.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');

    // Get all reservations
    console.log('2. Getting all reservations...');
    const reservationsResponse = await axios.get('http://localhost:5000/api/reservations/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const reservations = reservationsResponse.data;
    console.log(`Found ${reservations.length} reservations\n`);

    // Find an active reservation
    const activeReservation = reservations.find(r => r.status === 'active');
    if (!activeReservation) {
      console.log('❌ No active reservations found to test with!');
      return;
    }

    console.log('Testing with reservation:');
    console.log(`  ID: ${activeReservation.id}`);
    console.log(`  Tool: ${activeReservation.tool_name} (ID: ${activeReservation.tool_id})`);
    console.log(`  Dates: ${activeReservation.start_date} to ${activeReservation.end_date}`);
    console.log(`  Quantity: ${activeReservation.quantity || 1}`);
    console.log(`  Status: ${activeReservation.status}\n`);

    // Check current availability for the tool
    console.log('3. Checking tool availability BEFORE cancellation...');
    const availBefore = await axios.get(
      `http://localhost:5000/api/tools/${activeReservation.tool_id}/availability`,
      {
        params: {
          start: activeReservation.start_date,
          end: activeReservation.end_date,
          quantity: activeReservation.quantity || 1
        }
      }
    );

    console.log('Availability BEFORE cancellation:');
    console.log(`  Total Stock: ${availBefore.data.totalStock}`);
    console.log(`  Reserved Stock: ${availBefore.data.reservedStock}`);
    console.log(`  Available Stock: ${availBefore.data.availableStock}`);
    console.log(`  Available for rental: ${availBefore.data.available ? '✅ YES' : '❌ NO'}\n`);

    // Cancel the reservation
    console.log('4. Cancelling the reservation...');
    await axios.post(
      `http://localhost:5000/api/reservations/${activeReservation.id}/cancel`,
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('✅ Reservation cancelled successfully!\n');

    // Check availability again AFTER cancellation
    console.log('5. Checking tool availability AFTER cancellation...');
    const availAfter = await axios.get(
      `http://localhost:5000/api/tools/${activeReservation.tool_id}/availability`,
      {
        params: {
          start: activeReservation.start_date,
          end: activeReservation.end_date,
          quantity: activeReservation.quantity || 1
        }
      }
    );

    console.log('Availability AFTER cancellation:');
    console.log(`  Total Stock: ${availAfter.data.totalStock}`);
    console.log(`  Reserved Stock: ${availAfter.data.reservedStock}`);
    console.log(`  Available Stock: ${availAfter.data.availableStock}`);
    console.log(`  Available for rental: ${availAfter.data.available ? '✅ YES' : '❌ NO'}\n`);

    // Verify stock was freed up
    console.log('6. Verifying stock update...');
    const stockFreed = availAfter.data.availableStock - availBefore.data.availableStock;
    const expectedFreed = activeReservation.quantity || 1;

    if (stockFreed === expectedFreed) {
      console.log(`✅ SUCCESS! Stock was correctly freed up!`);
      console.log(`   ${expectedFreed} unit(s) returned to available stock\n`);
    } else {
      console.log(`❌ ISSUE: Expected ${expectedFreed} units freed, but got ${stockFreed}\n`);
    }

    // Show final status
    console.log('='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Before Cancel: ${availBefore.data.availableStock} available / ${availBefore.data.totalStock} total`);
    console.log(`After Cancel:  ${availAfter.data.availableStock} available / ${availAfter.data.totalStock} total`);
    console.log(`Stock Freed:   +${stockFreed} unit(s)`);
    console.log('='.repeat(60));

    if (availAfter.data.available && !availBefore.data.available) {
      console.log('\n✅ The tool is NOW AVAILABLE for the same dates!');
      console.log('   Cancelling reservations correctly updates stock availability!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testCancelAndStockUpdate();
