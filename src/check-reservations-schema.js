const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('Checking reservations table schema...\n');

db.all('PRAGMA table_info(reservations)', [], (err, columns) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('Reservations table columns:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})${col.dflt_value ? ' DEFAULT ' + col.dflt_value : ''}`);
  });

  console.log('\n\nChecking current reservation statuses:');
  db.all('SELECT id, status FROM reservations', [], (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      rows.forEach(r => {
        console.log(`  Reservation ${r.id}: ${r.status}`);
      });
    }

    console.log('\n\nTrying to manually update a reservation to "delivered"...');
    db.run('UPDATE reservations SET status = ? WHERE id = 4', ['delivered'], function(err) {
      if (err) {
        console.error('❌ Error updating:', err.message);
      } else {
        console.log(`✅ Successfully updated ${this.changes} row(s)`);

        // Check the new value
        db.get('SELECT id, status FROM reservations WHERE id = 4', [], (err, row) => {
          if (row) {
            console.log(`Reservation 4 new status: ${row.status}`);
          }
          db.close();
        });
      }
    });
  });
});
