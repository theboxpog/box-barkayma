const db = require('./database');

// Test creating a reservation
const testReservation = {
  user_id: 1,
  tool_id: 1,
  start_date: '2024-12-25',
  end_date: '2024-12-27',
  quantity: 1,
  total_price: 100,
  status: 'active'
};

console.log('Testing reservation creation with data:', testReservation);

db.run(
  'INSERT INTO reservations (user_id, tool_id, start_date, end_date, quantity, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
  [
    testReservation.user_id,
    testReservation.tool_id,
    testReservation.start_date,
    testReservation.end_date,
    testReservation.quantity,
    testReservation.total_price,
    testReservation.status
  ],
  function (err) {
    if (err) {
      console.error('❌ Error creating reservation:', err.message);
      console.error('Error details:', err);
    } else {
      console.log('✅ Reservation created successfully with ID:', this.lastID);
    }

    process.exit(err ? 1 : 0);
  }
);
