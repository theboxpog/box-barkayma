const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('Adding quantity column to reservations table...\n');

db.run(`ALTER TABLE reservations ADD COLUMN quantity INTEGER DEFAULT 1`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('✅ Quantity column already exists!');
    } else {
      console.error('❌ Error:', err.message);
    }
  } else {
    console.log('✅ Quantity column added successfully!');
  }

  db.close();
  console.log('\nDatabase updated. You can now select quantity when renting tools!');
});
