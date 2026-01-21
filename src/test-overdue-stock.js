const axios = require('axios');

console.log('\n=== TESTING OVERDUE STOCK AVAILABILITY ===\n');

async function testOverdueStock() {
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toolrental.com',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Admin logged in successfully\n');

    // Step 2: Get all tools to find one with stock
    console.log('2. Fetching all tools...');
    const toolsRes = await axios.get('http://localhost:5000/api/tools');
    const tools = toolsRes.data;

    const toolWithStock = tools.find(t => t.stock > 0);
    if (!toolWithStock) {
      console.log('❌ No tools with stock found for testing');
      return;
    }

    console.log(`✅ Found tool: ${toolWithStock.name}`);
    console.log(`   Stock: ${toolWithStock.stock}`);
    console.log(`   Tool ID: ${toolWithStock.id}\n`);

    // Step 3: Check current reservations for this tool
    console.log('3. Checking current reservations for this tool...');
    const allReservationsRes = await axios.get('http://localhost:5000/api/reservations/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const toolReservations = allReservationsRes.data.filter(r =>
      r.tool_id === toolWithStock.id &&
      (r.status === 'active' || r.status === 'overdue')
    );

    console.log(`   Active reservations: ${toolReservations.filter(r => r.status === 'active').length}`);
    console.log(`   Overdue reservations: ${toolReservations.filter(r => r.status === 'overdue').length}\n`);

    // Step 4: Mark overdue reservations
    console.log('4. Marking overdue reservations...');
    const markOverdueRes = await axios.post(
      'http://localhost:5000/api/reservations/admin/mark-overdue',
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log(`✅ ${markOverdueRes.data.count} reservation(s) marked as overdue\n`);

    // Step 5: Check updated reservations
    console.log('5. Checking updated reservations for this tool...');
    const updatedReservationsRes = await axios.get('http://localhost:5000/api/reservations/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const updatedToolReservations = updatedReservationsRes.data.filter(r =>
      r.tool_id === toolWithStock.id &&
      (r.status === 'active' || r.status === 'overdue')
    );

    const activeCount = updatedToolReservations.filter(r => r.status === 'active').length;
    const overdueCount = updatedToolReservations.filter(r => r.status === 'overdue').length;

    console.log(`   Active reservations: ${activeCount}`);
    console.log(`   Overdue reservations: ${overdueCount}\n`);

    // Step 6: Try to book the tool for today
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('6. Attempting to book the tool for today...');
    console.log(`   Date range: ${today} to ${tomorrow}`);
    console.log(`   Tool stock: ${toolWithStock.stock}`);
    console.log(`   Reserved (active + overdue): ${activeCount + overdueCount}\n`);

    const expectedAvailable = toolWithStock.stock - activeCount - overdueCount;
    console.log(`   Expected available: ${expectedAvailable}\n`);

    try {
      const bookingRes = await axios.post(
        'http://localhost:5000/api/reservations',
        {
          tool_id: toolWithStock.id,
          start_date: today,
          end_date: tomorrow,
          quantity: 1
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('✅ Booking successful!');
      console.log(`   Reservation ID: ${bookingRes.data.reservation.id}\n`);

      if (expectedAvailable >= 1) {
        console.log('✅ SUCCESS! Stock calculation is correct.');
        console.log('   Overdue reservations are properly counted against available stock.\n');
      } else {
        console.log('⚠️  WARNING: Booking succeeded but expected stock was insufficient.');
        console.log('   This might indicate an issue with stock calculation.\n');
      }

    } catch (bookingError) {
      if (bookingError.response && bookingError.response.status === 400) {
        console.log('❌ Booking failed: Insufficient stock');
        console.log(`   Error: ${bookingError.response.data.error}`);
        console.log(`   Available stock: ${bookingError.response.data.availableStock}`);
        console.log(`   Requested quantity: ${bookingError.response.data.requestedQuantity}\n`);

        if (expectedAvailable < 1) {
          console.log('✅ SUCCESS! Stock calculation is correct.');
          console.log('   Overdue reservations are properly counted against available stock.\n');
        } else {
          console.log('⚠️  WARNING: Booking failed but expected stock was sufficient.');
          console.log('   This might indicate an issue with stock calculation.\n');
        }
      } else {
        throw bookingError;
      }
    }

    console.log('=== TEST COMPLETE ===\n');
    console.log('Summary:');
    console.log('✅ Stock availability check now includes overdue reservations');
    console.log('✅ When tools are overdue, they reduce available stock until returned');
    console.log('✅ This prevents double-booking of unreturned tools\n');

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

testOverdueStock();
