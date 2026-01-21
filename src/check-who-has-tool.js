const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Who Has the Circular Saw ===\n');

const today = new Date().toISOString().split('T')[0];

// Get the Circular Saw tool
db.get('SELECT id, name, stock FROM tools WHERE name = "Circular Saw"', [], (err, tool) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  if (!tool) {
    console.error('Circular Saw not found!');
    db.close();
    return;
  }

  console.log(`Tool: ${tool.name}`);
  console.log(`Total Stock: ${tool.stock}`);
  console.log(`Today: ${today}\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Get all active/delivered/overdue reservations for this tool
  db.all(
    `SELECT
      r.id,
      r.user_id,
      r.start_date,
      r.end_date,
      r.quantity,
      r.status,
      r.total_price,
      u.name as user_name,
      u.email as user_email
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     WHERE r.tool_id = ?
     AND r.status IN ('active', 'delivered', 'overdue')
     ORDER BY r.start_date DESC`,
    [tool.id],
    (err, reservations) => {
      if (err) {
        console.error('Error:', err);
        db.close();
        return;
      }

      if (reservations.length === 0) {
        console.log('No active/delivered/overdue reservations found.\n');
        db.close();
        return;
      }

      console.log(`Found ${reservations.length} reservation(s):\n`);

      let totalReservedToday = 0;

      reservations.forEach((r, index) => {
        const includesToday = r.start_date <= today && r.end_date >= today;
        const marker = includesToday ? '🚨 ACTIVE TODAY' : '   (not today)';

        console.log(`${index + 1}. Reservation ID: ${r.id} ${marker}`);
        console.log(`   User: ${r.user_name} (${r.user_email})`);
        console.log(`   Status: ${r.status.toUpperCase()}`);
        console.log(`   Quantity: ${r.quantity || 1}`);
        console.log(`   Dates: ${r.start_date} to ${r.end_date}`);
        console.log(`   Price: $${r.total_price}`);
        console.log('   ───────────────────────────────────────');

        if (includesToday) {
          totalReservedToday += (r.quantity || 1);
        }
      });

      const availableToday = tool.stock - totalReservedToday;

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('SUMMARY FOR TODAY:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`  Total Stock: ${tool.stock}`);
      console.log(`  Reserved Today: ${totalReservedToday}`);
      console.log(`  Available Today: ${availableToday}`);

      if (availableToday === 0) {
        console.log('\n  🚨 ZERO STOCK AVAILABLE - WARNING WILL SHOW!');
      } else {
        console.log(`\n  ✓ ${availableToday} unit(s) still available`);
      }
      console.log('═══════════════════════════════════════════════════════════════\n');

      db.close();
    }
  );
});
