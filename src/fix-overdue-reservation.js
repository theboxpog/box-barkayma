const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Fixing Overdue Reservation ===\n');

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// Create a proper overdue reservation (end date in the PAST)
const startDate = new Date(today);
startDate.setDate(startDate.getDate() - 7); // Started 7 days ago
const startDateStr = startDate.toISOString().split('T')[0];

const endDate = new Date(today);
endDate.setDate(endDate.getDate() - 2); // Should have ended 2 days ago
const endDateStr = endDate.toISOString().split('T')[0];

console.log('Dates:');
console.log(`  Start: ${startDateStr}`);
console.log(`  End: ${endDateStr} (PAST - should be returned already)`);
console.log(`  Today: ${todayStr}`);
console.log(`  Is overdue? ${endDateStr < todayStr ? 'YES ✓' : 'NO'}\n`);

// Delete the incorrect reservation and create a correct one
db.run('DELETE FROM reservations WHERE id = 47', (err) => {
  if (err) {
    console.error('Error deleting old reservation:', err);
    db.close();
    return;
  }

  console.log('✓ Deleted incorrect reservation (ID 47)\n');

  // Get admin and tool
  db.get('SELECT id FROM users WHERE role = "admin" LIMIT 1', (err, admin) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    db.get('SELECT id, name, price_per_day, stock FROM tools WHERE name = "Circular Saw"', (err, tool) => {
      if (err) {
        console.error('Error:', err);
        db.close();
        return;
      }

      const days = Math.ceil((new Date(endDateStr) - new Date(startDateStr)) / (1000 * 60 * 60 * 24));
      const quantity = 1;
      const totalPrice = days * tool.price_per_day * quantity;

      // Create with 'delivered' status first (proper workflow)
      db.run(
        `INSERT INTO reservations
         (user_id, tool_id, start_date, end_date, quantity, total_price, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'delivered', datetime('now'))`,
        [admin.id, tool.id, startDateStr, endDateStr, quantity, totalPrice],
        function (err) {
          if (err) {
            console.error('Error:', err);
            db.close();
            return;
          }

          const newId = this.lastID;
          console.log('✓ Created new reservation (ID ' + newId + ') with status=delivered\n');

          // Now run the auto-mark-overdue logic
          db.run(
            `UPDATE reservations
             SET status = 'overdue'
             WHERE (status = 'active' OR status = 'delivered')
             AND end_date < ?`,
            [todayStr],
            (err) => {
              if (err) {
                console.error('Error:', err);
                db.close();
                return;
              }

              console.log('✓ Ran auto-mark-overdue logic\n');

              // Verify the result
              db.get('SELECT * FROM reservations WHERE id = ?', [newId], (err, r) => {
                if (err) {
                  console.error('Error:', err);
                  db.close();
                  return;
                }

                console.log('═══════════════════════════════════════');
                console.log('FINAL RESULT:');
                console.log('═══════════════════════════════════════');
                console.log(`  Reservation ID: ${r.id}`);
                console.log(`  Tool: ${tool.name}`);
                console.log(`  Start: ${r.start_date}`);
                console.log(`  End: ${r.end_date} (${r.end_date < todayStr ? 'PAST' : 'FUTURE'})`);
                console.log(`  Today: ${todayStr}`);
                console.log(`  Status: ${r.status.toUpperCase()}`);
                console.log(`  Quantity: ${r.quantity}`);

                if (r.status === 'overdue' && r.end_date < todayStr) {
                  console.log('\n✓ CORRECT: Status is overdue because end_date < today');
                  console.log('\n🚨 This will trigger the RED WARNING in View Reservations!');
                } else {
                  console.log('\n✗ ERROR: Status should be overdue!');
                }
                console.log('═══════════════════════════════════════\n');

                db.close();
              });
            }
          );
        }
      );
    });
  });
});
