const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('Checking for quantity column in reservations...\n');

db.all('PRAGMA table_info(reservations)', [], (err, columns) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('Reservations table columns:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  const hasQuantityColumn = columns.some(col => col.name === 'quantity');

  if (hasQuantityColumn) {
    console.log('\n✅ Quantity column exists!');

    // Show current reservations with quantities
    db.all(`
      SELECT r.id, t.name as tool_name, r.start_date, r.end_date, r.quantity, r.status
      FROM reservations r
      JOIN tools t ON r.tool_id = t.id
    `, [], (err, reservations) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('\nCurrent reservations:');
        if (reservations.length === 0) {
          console.log('  (No reservations)');
        } else {
          reservations.forEach(res => {
            console.log(`  ${res.tool_name}: ${res.quantity || 1} unit(s) from ${res.start_date} to ${res.end_date} [${res.status}]`);
          });
        }
      }
      db.close();
    });
  } else {
    console.log('\n❌ Quantity column does NOT exist!');
    console.log('Run: node add-quantity-column.js');
    db.close();
  }
});
