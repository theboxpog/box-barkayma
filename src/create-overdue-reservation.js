const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Creating Overdue Reservation for Testing ===\n');

// Get today's date
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// Create dates for an overdue reservation that includes today
const startDate = new Date(today);
startDate.setDate(startDate.getDate() - 5); // Started 5 days ago
const startDateStr = startDate.toISOString().split('T')[0];

const endDate = new Date(today);
endDate.setDate(endDate.getDate() + 2); // Should end in 2 days (overdue = past end date)
const endDateStr = endDate.toISOString().split('T')[0];

console.log('Date Range:');
console.log(`  Start: ${startDateStr}`);
console.log(`  End: ${endDateStr}`);
console.log(`  Today: ${todayStr}`);
console.log(`  Status: This reservation INCLUDES today\n`);

// First, get admin user and a tool
db.get('SELECT id, name, email FROM users WHERE role = "admin" LIMIT 1', [], (err, admin) => {
  if (err) {
    console.error('Error finding admin:', err);
    db.close();
    return;
  }

  if (!admin) {
    console.error('No admin user found!');
    db.close();
    return;
  }

  console.log(`Admin User: ${admin.name} (${admin.email})`);

  // Get a tool
  db.get('SELECT id, name, price_per_day, stock FROM tools LIMIT 1', [], (err, tool) => {
    if (err) {
      console.error('Error finding tool:', err);
      db.close();
      return;
    }

    if (!tool) {
      console.error('No tools found!');
      db.close();
      return;
    }

    console.log(`Tool: ${tool.name} (Stock: ${tool.stock})\n`);

    // Calculate rental days and price
    const days = Math.ceil((new Date(endDateStr) - new Date(startDateStr)) / (1000 * 60 * 60 * 24));
    const quantity = Math.min(tool.stock, 2); // Reserve 2 items or all available
    const totalPrice = days * tool.price_per_day * quantity;

    console.log('Reservation Details:');
    console.log(`  Quantity: ${quantity}`);
    console.log(`  Days: ${days}`);
    console.log(`  Total Price: $${totalPrice.toFixed(2)}\n`);

    // Create the overdue reservation
    db.run(
      `INSERT INTO reservations
       (user_id, tool_id, start_date, end_date, quantity, total_price, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'overdue', datetime('now'))`,
      [admin.id, tool.id, startDateStr, endDateStr, quantity, totalPrice],
      function (err) {
        if (err) {
          console.error('Error creating reservation:', err);
          db.close();
          return;
        }

        console.log('✓ SUCCESS! Overdue reservation created');
        console.log(`  Reservation ID: ${this.lastID}`);
        console.log(`  User: ${admin.name}`);
        console.log(`  Tool: ${tool.name}`);
        console.log(`  Status: OVERDUE`);
        console.log(`  Quantity: ${quantity}`);
        console.log(`\nNow check the admin dashboard:`);
        console.log(`  1. Go to "View Reservations"`);
        console.log(`  2. Click on "${admin.name}"`);
        console.log(`  3. Filter by "Overdue"`);
        console.log(`  4. Look for RED WARNING if stock is fully reserved!\n`);

        // Check if this will trigger the warning
        db.all(
          `SELECT quantity FROM reservations
           WHERE tool_id = ?
           AND status IN ('active', 'delivered', 'overdue')`,
          [tool.id],
          (err, reservations) => {
            if (err) {
              console.error('Error checking reservations:', err);
              db.close();
              return;
            }

            const totalReserved = reservations.reduce((sum, r) => sum + (r.quantity || 1), 0);
            const available = tool.stock - totalReserved;

            console.log('Stock Status:');
            console.log(`  Total Stock: ${tool.stock}`);
            console.log(`  Total Reserved: ${totalReserved}`);
            console.log(`  Available: ${available}`);

            if (available === 0) {
              console.log(`\n🚨 WARNING WILL SHOW: Zero stock available!`);
            } else {
              console.log(`\n✓ Stock still available (warning won't show unless stock runs out)`);
            }

            db.close();
          }
        );
      }
    );
  });
});
