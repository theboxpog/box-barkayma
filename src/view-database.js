const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('=== COMPLETE DATABASE VIEW ===\n');

// View Users
console.log('📋 USERS TABLE:');
console.log('─'.repeat(60));
db.all('SELECT id, name, email, role FROM users', [], (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
  } else {
    users.forEach(user => {
      console.log(`[${user.role.toUpperCase()}] ${user.name} - ${user.email}`);
    });
    console.log(`Total: ${users.length} users\n`);
  }

  // View Tools
  console.log('🔧 TOOLS TABLE:');
  console.log('─'.repeat(60));
  db.all('SELECT id, name, category, price_per_day, is_available FROM tools', [], (err, tools) => {
    if (err) {
      console.error('Error fetching tools:', err);
    } else {
      tools.forEach(tool => {
        const status = tool.is_available ? '✅ Available' : '❌ Unavailable';
        console.log(`${tool.name} (${tool.category}) - $${tool.price_per_day}/day ${status}`);
      });
      console.log(`Total: ${tools.length} tools\n`);
    }

    // View Reservations
    console.log('📅 RESERVATIONS TABLE:');
    console.log('─'.repeat(60));
    db.all(`
      SELECT r.id, u.name as user_name, t.name as tool_name,
             r.start_date, r.end_date, r.status, r.total_price
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN tools t ON r.tool_id = t.id
    `, [], (err, reservations) => {
      if (err) {
        console.error('Error fetching reservations:', err);
      } else if (reservations.length === 0) {
        console.log('(No reservations yet)');
      } else {
        reservations.forEach(res => {
          console.log(`${res.user_name} rented ${res.tool_name}`);
          console.log(`  ${res.start_date} to ${res.end_date} - $${res.total_price} [${res.status}]`);
        });
      }
      console.log(`Total: ${reservations.length} reservations\n`);

      // View Payments
      console.log('💳 PAYMENTS TABLE:');
      console.log('─'.repeat(60));
      db.all(`
        SELECT p.id, u.name as user_name, p.amount, p.success, p.timestamp
        FROM payments p
        JOIN users u ON p.user_id = u.id
      `, [], (err, payments) => {
        if (err) {
          console.error('Error fetching payments:', err);
        } else if (payments.length === 0) {
          console.log('(No payments yet)');
        } else {
          payments.forEach(pay => {
            const status = pay.success ? '✅ Success' : '❌ Failed';
            console.log(`${pay.user_name} - $${pay.amount} ${status} (${pay.timestamp})`);
          });
        }
        console.log(`Total: ${payments.length} payments\n`);

        console.log('='.repeat(60));
        db.close();
      });
    });
  });
});
