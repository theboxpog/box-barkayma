const db = require('./database');

console.log('Checking reservation ID 34 and user ID 7...\n');

// Check all users
db.all('SELECT id, name, email FROM users', [], (err, users) => {
  console.log('=== ALL USERS ===');
  users.forEach(u => {
    console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
  });
  console.log('\n');

  // Check if user 7 exists
  const user7 = users.find(u => u.id === 7);
  if (user7) {
    console.log('User ID 7 EXISTS:', user7);
  } else {
    console.log('❌ User ID 7 DOES NOT EXIST - This is an orphaned reservation!');
  }
  console.log('\n');

  // Check the reservation
  db.get('SELECT * FROM reservations WHERE id = 34', [], (err, res) => {
    console.log('=== RESERVATION 34 ===');
    console.log(res);
    console.log('\n');

    // Check all orphaned reservations
    db.all(`
      SELECT r.id, r.user_id, r.tool_id, r.start_date, r.end_date, r.status
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE u.id IS NULL
    `, [], (err, orphaned) => {
      console.log('=== ALL ORPHANED RESERVATIONS ===');
      if (orphaned.length === 0) {
        console.log('No orphaned reservations found');
      } else {
        console.log(`Found ${orphaned.length} orphaned reservation(s):`);
        orphaned.forEach(o => {
          console.log(`  - Reservation ID ${o.id}: user_id=${o.user_id} (deleted), tool_id=${o.tool_id}, dates=${o.start_date} to ${o.end_date}, status=${o.status}`);
        });
      }

      process.exit();
    });
  });
});
