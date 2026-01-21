const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Verifying Warning Logic (Matches AdminDashboard) ===\n');

const today = new Date().toISOString().split('T')[0];

// Get Circular Saw
db.get('SELECT id, name, stock FROM tools WHERE name = "Circular Saw"', [], (err, tool) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log(`Tool: ${tool.name}`);
  console.log(`Total Stock: ${tool.stock}`);
  console.log(`Today: ${today}\n`);

  // Get all active/delivered/overdue reservations (matches getAvailableQuantity)
  db.all(
    `SELECT id, user_id, status, quantity, start_date, end_date
     FROM reservations
     WHERE tool_id = ?
     AND status IN ('active', 'delivered', 'overdue')`,
    [tool.id],
    (err, reservations) => {
      if (err) {
        console.error('Error:', err);
        db.close();
        return;
      }

      console.log('Reservations found:', reservations.length, '\n');

      // Calculate reserved quantity using SAME logic as AdminDashboard.getAvailableQuantity
      let reservedQuantity = 0;

      reservations.forEach((r, index) => {
        console.log(`${index + 1}. Reservation ID ${r.id}:`);
        console.log(`   Status: ${r.status}`);
        console.log(`   Dates: ${r.start_date} to ${r.end_date}`);
        console.log(`   Quantity: ${r.quantity || 1}`);

        let countsToday = false;

        if (r.status === 'active') {
          // Active: check if overlap with today
          if (r.start_date <= today && r.end_date >= today) {
            countsToday = true;
            reservedQuantity += (r.quantity || 1);
          }
        } else if (r.status === 'delivered') {
          // Delivered: tool is with customer, always reduce quantity
          countsToday = true;
          reservedQuantity += (r.quantity || 1);
        } else if (r.status === 'overdue') {
          // Overdue: tool is still with customer if start_date <= today
          if (r.start_date <= today) {
            countsToday = true;
            reservedQuantity += (r.quantity || 1);
          }
        }

        console.log(`   Reduces stock today? ${countsToday ? 'YES' : 'NO'}`);
        console.log('');
      });

      const availableQty = tool.stock - reservedQuantity;

      console.log('═══════════════════════════════════════════════════════════');
      console.log('AVAILABILITY CALCULATION:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  Total Stock: ${tool.stock}`);
      console.log(`  Reserved (using AdminDashboard logic): ${reservedQuantity}`);
      console.log(`  Available: ${availableQty}`);
      console.log('═══════════════════════════════════════════════════════════\n');

      // Check warning conditions for each reservation
      console.log('WARNING CHECK FOR EACH RESERVATION:\n');

      reservations.forEach((r) => {
        // Warning logic from AdminDashboard
        const isActiveToday = r.status === 'overdue'
          ? r.start_date <= today
          : r.start_date <= today && r.end_date >= today;

        const hasZeroAvailability = availableQty === 0;
        const isActiveStatus = ['active', 'delivered', 'overdue'].includes(r.status);
        const showWarning = isActiveToday && hasZeroAvailability && isActiveStatus;

        console.log(`Reservation ${r.id} (${r.status}):`);
        console.log(`  isActiveToday: ${isActiveToday}`);
        console.log(`  hasZeroAvailability: ${hasZeroAvailability}`);
        console.log(`  isActiveStatus: ${isActiveStatus}`);
        console.log(`  → showWarning: ${showWarning ? '🚨 YES - RED WARNING!' : 'NO'}`);
        console.log('');
      });

      console.log('═══════════════════════════════════════════════════════════');
      if (availableQty === 0 && reservations.some(r => {
        const isActiveToday = r.status === 'overdue' ? r.start_date <= today : r.start_date <= today && r.end_date >= today;
        return isActiveToday;
      })) {
        console.log('✓ RED WARNING WILL SHOW IN ADMIN DASHBOARD!');
      } else {
        console.log('✗ Warning will not show');
      }
      console.log('═══════════════════════════════════════════════════════════\n');

      db.close();
    }
  );
});
