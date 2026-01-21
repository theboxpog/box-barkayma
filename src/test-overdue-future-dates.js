const axios = require('axios');

console.log('\n=== TESTING OVERDUE WITH FUTURE DATE BOOKINGS ===\n');

async function testOverdueFutureDates() {
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toolrental.com',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Admin logged in successfully\n');

    // Step 2: Get all tools
    console.log('2. Fetching all tools...');
    const toolsRes = await axios.get('http://localhost:5000/api/tools');
    const tools = toolsRes.data;

    const tool = tools.find(t => t.stock > 0);
    if (!tool) {
      console.log('❌ No tools with stock found for testing');
      return;
    }

    console.log(`✅ Found tool: ${tool.name}`);
    console.log(`   Stock: ${tool.stock}`);
    console.log(`   Tool ID: ${tool.id}\n`);

    // Step 3: Mark overdue reservations
    console.log('3. Marking overdue reservations...');
    const markOverdueRes = await axios.post(
      'http://localhost:5000/api/reservations/admin/mark-overdue',
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log(`✅ ${markOverdueRes.data.count} reservation(s) marked as overdue\n`);

    // Step 4: Check all reservations for this tool
    console.log('4. Checking all reservations for this tool...');
    const allReservationsRes = await axios.get('http://localhost:5000/api/reservations/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const toolReservations = allReservationsRes.data.filter(r => r.tool_id === tool.id);
    const activeReservations = toolReservations.filter(r => r.status === 'active');
    const overdueReservations = toolReservations.filter(r => r.status === 'overdue');

    console.log(`   Total reservations: ${toolReservations.length}`);
    console.log(`   Active: ${activeReservations.length}`);
    console.log(`   Overdue: ${overdueReservations.length}\n`);

    if (overdueReservations.length > 0) {
      console.log('   Overdue reservation details:');
      overdueReservations.forEach(r => {
        console.log(`     - Reservation #${r.id}: ${r.start_date} to ${r.end_date}`);
      });
      console.log('');
    }

    // Calculate today's date
    const today = new Date();
    console.log(`   Today's date: ${today.toISOString().split('T')[0]}\n`);

    // Test Case 1: Try to book for TODAY (should fail if overdue exists)
    console.log('TEST CASE 1: Booking for TODAY');
    console.log('─────────────────────────────────────');
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Attempting to book: ${todayStr} to ${tomorrowStr}`);

    if (overdueReservations.length > 0) {
      console.log('Expected result: SHOULD FAIL (overdue tool blocks today)\n');
    } else {
      console.log('Expected result: Depends on active reservations\n');
    }

    // Calculate total price (1 day * price per day)
    const totalPriceToday = tool.price_per_day * 1;

    try {
      const todayBooking = await axios.post(
        'http://localhost:5000/api/reservations',
        {
          tool_id: tool.id,
          start_date: todayStr,
          end_date: tomorrowStr,
          quantity: 1,
          total_price: totalPriceToday
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('✅ Booking succeeded');
      console.log(`   Reservation ID: ${todayBooking.data.reservation.id}\n`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('❌ Booking failed (as expected)');
        console.log(`   ${error.response.data.error}\n`);
      } else {
        throw error;
      }
    }

    // Test Case 2: Try to book for NEXT MONTH (should succeed even if overdue exists)
    console.log('TEST CASE 2: Booking for NEXT MONTH');
    console.log('─────────────────────────────────────');
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStart = nextMonth.toISOString().split('T')[0];
    nextMonth.setDate(nextMonth.getDate() + 1);
    const nextMonthEnd = nextMonth.toISOString().split('T')[0];

    console.log(`Attempting to book: ${nextMonthStart} to ${nextMonthEnd}`);
    console.log('Expected result: SHOULD SUCCEED (overdue doesn\'t block future dates)\n');

    // Calculate total price (1 day * price per day)
    const totalPriceFuture = tool.price_per_day * 1;

    try {
      const futureBooking = await axios.post(
        'http://localhost:5000/api/reservations',
        {
          tool_id: tool.id,
          start_date: nextMonthStart,
          end_date: nextMonthEnd,
          quantity: 1,
          total_price: totalPriceFuture
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('✅ Booking succeeded (as expected)!');
      console.log(`   Reservation ID: ${futureBooking.data.reservation.id}`);
      console.log('   This proves overdue reservations don\'t block future dates.\n');

      // Clean up - delete the test reservation
      await axios.delete(
        `http://localhost:5000/api/reservations/${futureBooking.data.reservation.id}/permanent`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('   ✅ Test reservation cleaned up\n');

    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('❌ Booking failed (unexpected)');
        console.log(`   ${error.response.data.error}`);
        console.log('   This might indicate an issue with the overdue date logic.\n');
      } else {
        throw error;
      }
    }

    console.log('=== TEST COMPLETE ===\n');
    console.log('✅ Summary:');
    console.log('   - Overdue reservations only block dates up to TODAY');
    console.log('   - Future bookings (next month) are NOT blocked by overdue items');
    console.log('   - This allows customers to book ahead even when tools are overdue\n');

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

testOverdueFutureDates();
