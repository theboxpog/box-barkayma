const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('========================================');
console.log('   ADDING PREVIOUS_STATUS COLUMN');
console.log('========================================\n');

db.serialize(() => {
  console.log('1. Checking if column already exists...');

  db.all(`PRAGMA table_info(reservations)`, [], (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err);
      db.close();
      return;
    }

    const hasPreviousStatus = columns.some(col => col.name === 'previous_status');

    if (hasPreviousStatus) {
      console.log('   ✓ Column already exists, skipping migration\n');
      db.close();
      return;
    }

    console.log('   ✓ Column does not exist, proceeding with migration\n');

    console.log('2. Adding previous_status column...');
    db.run(`
      ALTER TABLE reservations
      ADD COLUMN previous_status TEXT
    `, (err) => {
      if (err) {
        console.error('Error adding column:', err);
        db.close();
        return;
      }
      console.log('   ✓ Column added successfully\n');

      console.log('========================================');
      console.log('   MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('========================================\n');
      console.log('previous_status column has been added to reservations table.\n');

      db.close();
    });
  });
});
