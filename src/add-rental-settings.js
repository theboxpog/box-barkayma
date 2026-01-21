const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');

console.log('\n=== ADDING RENTAL SETTINGS TABLE ===\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  console.log('1. Creating rental_settings table...');

  db.run(`
    CREATE TABLE IF NOT EXISTS rental_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating table:', err);
      db.close();
      return;
    }
    console.log('✅ rental_settings table created\n');

    console.log('2. Inserting default allowed rental days (all days enabled)...');

    // Insert default settings - all days allowed (0=Sunday, 1=Monday, ... 6=Saturday)
    const defaultDays = JSON.stringify([0, 1, 2, 3, 4, 5, 6]);

    db.run(`
      INSERT OR IGNORE INTO rental_settings (setting_key, setting_value)
      VALUES ('allowed_rental_days', ?)
    `, [defaultDays], (err) => {
      if (err) {
        console.error('❌ Error inserting default settings:', err);
      } else {
        console.log('✅ Default settings inserted\n');
      }

      console.log('=== MIGRATION COMPLETE ===\n');
      console.log('✅ Rental settings table is ready!');
      console.log('   Default: All days of the week are allowed for rentals\n');

      db.close();
    });
  });
});
