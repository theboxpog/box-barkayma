// Migration script to update the users table to support subadmin role
// SQLite doesn't support ALTER TABLE to modify CHECK constraints,
// so we need to recreate the table

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('Starting migration to add subadmin role support...');

db.serialize(() => {
  // 1. Create new table with correct schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone_number TEXT,
      password_hash TEXT NOT NULL,
      google_id TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'subadmin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating new table:', err);
      return;
    }
    console.log('Created new users table with subadmin support');
  });

  // 2. Copy data from old table
  db.run(`
    INSERT INTO users_new (id, name, email, phone_number, password_hash, google_id, role, created_at)
    SELECT id, name, email, phone_number, password_hash, google_id, role, created_at
    FROM users
  `, (err) => {
    if (err) {
      console.error('Error copying data:', err);
      return;
    }
    console.log('Copied user data to new table');
  });

  // 3. Drop old table
  db.run(`DROP TABLE users`, (err) => {
    if (err) {
      console.error('Error dropping old table:', err);
      return;
    }
    console.log('Dropped old users table');
  });

  // 4. Rename new table
  db.run(`ALTER TABLE users_new RENAME TO users`, (err) => {
    if (err) {
      console.error('Error renaming table:', err);
      return;
    }
    console.log('Renamed new table to users');
    console.log('Migration completed successfully!');
  });
});

db.close();
