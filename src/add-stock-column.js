const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('Adding stock column to tools table...\n');

db.run(`ALTER TABLE tools ADD COLUMN stock INTEGER DEFAULT 1`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('✅ Stock column already exists!');
    } else {
      console.error('❌ Error:', err.message);
    }
    db.close();
  } else {
    console.log('✅ Stock column added successfully!');
    console.log('Setting default stock to 5 for existing tools...\n');

    // Set default stock for existing tools
    db.run(`UPDATE tools SET stock = 5 WHERE stock IS NULL OR stock = 0`, (err) => {
      if (err) {
        console.error('❌ Error setting default stock:', err.message);
      } else {
        console.log('✅ Default stock set for all tools!');
      }
      db.close();
      console.log('\nDatabase updated. Stock management is now active!');
    });
  }
});
