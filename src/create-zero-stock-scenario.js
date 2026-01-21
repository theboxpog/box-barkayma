const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Creating Zero-Stock Scenario for Testing ===\n');

// Get today's date
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// Create dates for an overdue reservation that includes today
const startDate = new Date(today);
startDate.setDate(startDate.getDate() - 3); // Started 3 days ago
const startDateStr = startDate.toISOString().split('T')[0];

const endDate = new Date(today);
endDate.setDate(endDate.getDate() + 1); // Ends tomorrow
const endDateStr = endDate.toISOString().split('T')[0];

console.log('Creating scenario where ALL stock is reserved/overdue...\n');

// Get admin user and a tool
db.get('SELECT id, name, email FROM users WHERE role = "admin" LIMIT 1', [], (err, admin) => {
  if (err) {
    console.error('Error finding admin:', err);
    db.close();
    return;
  }

  // Get a tool with low stock for easier testing
  db.get('SELECT id, name, price_per_day, stock FROM tools ORDER BY stock ASC LIMIT 1', [], (err, tool) => {
    if (err) {
      console.error('Error finding tool:', err);
      db.close();
      return;
    }

    console.log(`Tool: ${tool.name}`);
    console.log(`Total Stock: ${tool.stock}\n`);

    // Check current reservations
    db.all(
      `SELECT id, status, quantity, start_date, end_date FROM reservations
       WHERE tool_id = ?
       AND status IN ('active', 'delivered', 'overdue')`,
      [tool.id],
      (err, existingReservations) => {
        if (err) {
          console.error('Error checking reservations:', err);
          db.close();
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const currentlyReserved = existingReservations.reduce((sum, r) => {
          // Only count if it overlaps with today
          if (r.start_date <= today && r.end_date >= today) {
            return sum + (r.quantity || 1);
          }
          return sum;
        }, 0);

        const needToReserve = tool.stock - currentlyReserved;

        console.log(`Currently Reserved (overlapping today): ${currentlyReserved}`);
        console.log(`Need to Reserve: ${needToReserve}\n`);

        if (needToReserve <= 0) {
          console.log('✓ Stock is already fully reserved!');
          console.log('\nGo to Admin Dashboard → View Reservations → Admin User');
          console.log('You should see RED WARNINGS on reservations for today!\n');
          db.close();
          return;
        }

        // Create overdue reservations to fill up the stock
        const days = Math.ceil((new Date(endDateStr) - new Date(startDateStr)) / (1000 * 60 * 60 * 24));
        const totalPrice = days * tool.price_per_day * needToReserve;

        console.log(`Creating OVERDUE reservation for ${needToReserve} units...\n`);

        db.run(
          `INSERT INTO reservations
           (user_id, tool_id, start_date, end_date, quantity, total_price, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'overdue', datetime('now'))`,
          [admin.id, tool.id, startDateStr, endDateStr, needToReserve, totalPrice],
          function (err) {
            if (err) {
              console.error('Error creating reservation:', err);
              db.close();
              return;
            }

            console.log('✓ SUCCESS! Zero-stock scenario created!\n');
            console.log('═══════════════════════════════════════');
            console.log('Reservation Details:');
            console.log(`  ID: ${this.lastID}`);
            console.log(`  Tool: ${tool.name}`);
            console.log(`  Status: OVERDUE`);
            console.log(`  Quantity: ${needToReserve}`);
            console.log(`  Dates: ${startDateStr} to ${endDateStr}`);
            console.log(`  Includes Today: YES (${todayStr})`);
            console.log('═══════════════════════════════════════\n');

            // Verify zero stock
            db.all(
              `SELECT quantity FROM reservations
               WHERE tool_id = ?
               AND status IN ('active', 'delivered', 'overdue')
               AND start_date <= ?
               AND end_date >= ?`,
              [tool.id, todayStr, todayStr],
              (err, allReservations) => {
                if (err) {
                  console.error('Error verifying:', err);
                  db.close();
                  return;
                }

                const totalReservedToday = allReservations.reduce((sum, r) => sum + (r.quantity || 1), 0);
                const availableToday = tool.stock - totalReservedToday;

                console.log('📊 Stock Status for TODAY:');
                console.log(`  Total Stock: ${tool.stock}`);
                console.log(`  Reserved Today: ${totalReservedToday}`);
                console.log(`  Available Today: ${availableToday}`);

                if (availableToday === 0) {
                  console.log('\n🚨 ZERO STOCK AVAILABLE!');
                  console.log('═══════════════════════════════════════');
                  console.log('RED WARNING WILL NOW SHOW!');
                  console.log('═══════════════════════════════════════\n');
                  console.log('To see the warning:');
                  console.log('  1. Refresh Admin Dashboard');
                  console.log('  2. Go to "View Reservations"');
                  console.log('  3. Click on "Admin User"');
                  console.log('  4. Look for RED background and warning text!');
                  console.log('  5. The warning appears because:');
                  console.log('     - Reservation includes today ✓');
                  console.log('     - Available stock = 0 ✓');
                  console.log('     - Status is overdue ✓\n');
                } else {
                  console.log(`\n⚠️ Still ${availableToday} units available (warning won't show)\n`);
                }

                db.close();
              }
            );
          }
        );
      }
    );
  });
});
