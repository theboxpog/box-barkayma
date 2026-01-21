const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Power Drill Reservations ===\n');

const today = new Date().toISOString().split('T')[0];
console.log(`Today: ${today}\n`);

// Find Power Drill reservations by admin
db.all(
  `SELECT
    r.id,
    r.user_id,
    r.start_date,
    r.end_date,
    r.status,
    r.quantity,
    r.total_price,
    u.name as user_name,
    u.email as user_email,
    t.name as tool_name
   FROM reservations r
   JOIN users u ON r.user_id = u.id
   JOIN tools t ON r.tool_id = t.id
   WHERE t.name = 'Power Drill'
   AND u.role = 'admin'
   AND r.start_date >= '2025-12-15'
   ORDER BY r.start_date`,
  [],
  (err, reservations) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    if (reservations.length === 0) {
      console.log('No Power Drill reservations found for admin user.\n');
      db.close();
      return;
    }

    console.log(`Found ${reservations.length} Power Drill reservation(s):\n`);
    console.log('═'.repeat(70));

    reservations.forEach((r) => {
      console.log(`Reservation ID: ${r.id}`);
      console.log(`  User: ${r.user_name} (${r.user_email})`);
      console.log(`  Tool: ${r.tool_name}`);
      console.log(`  Start Date: ${r.start_date}`);
      console.log(`  End Date: ${r.end_date}`);
      console.log(`  Status: ${r.status.toUpperCase()}`);
      console.log(`  Quantity: ${r.quantity}`);
      console.log(`  Price: $${r.total_price}`);
      console.log('');

      // Check if it SHOULD be overdue
      const shouldBeOverdue = r.end_date < today;
      const isOverdue = r.status === 'overdue';

      console.log('  Analysis:');
      console.log(`    End date (${r.end_date}) < Today (${today}): ${shouldBeOverdue}`);
      console.log(`    Current status: ${r.status}`);
      console.log(`    Should be overdue: ${shouldBeOverdue ? 'YES' : 'NO'}`);
      console.log(`    Is marked overdue: ${isOverdue ? 'YES' : 'NO'}`);

      if (isOverdue && !shouldBeOverdue) {
        console.log('');
        console.log('  ❌ ERROR: This reservation is marked as overdue but should NOT be!');
        console.log(`     Reason: End date ${r.end_date} is AFTER today ${today}`);
        console.log(`     Expected status: active or delivered`);
      } else if (!isOverdue && shouldBeOverdue) {
        console.log('');
        console.log('  ⚠️  This reservation SHOULD be overdue but is not marked.');
      } else {
        console.log('');
        console.log('  ✓ Status is correct');
      }

      console.log('═'.repeat(70));
      console.log('');
    });

    db.close();
  }
);
