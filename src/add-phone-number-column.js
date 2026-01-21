const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('========================================');
console.log('   ADDING PHONE NUMBER COLUMN');
console.log('========================================\n');

db.serialize(() => {
  console.log('1. Checking if phone_number column already exists...');

  db.all(`PRAGMA table_info(users)`, [], (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err);
      db.close();
      return;
    }

    const hasPhoneNumber = columns.some(col => col.name === 'phone_number');

    if (hasPhoneNumber) {
      console.log('   ✓ phone_number column already exists, skipping migration\n');
      db.close();
      return;
    }

    console.log('   ✓ phone_number column does not exist, proceeding with migration\n');

    console.log('2. Adding phone_number column...');
    db.run(`
      ALTER TABLE users
      ADD COLUMN phone_number TEXT
    `, (err) => {
      if (err) {
        console.error('Error adding phone_number column:', err);
        db.close();
        return;
      }

      console.log('   ✓ phone_number column added successfully\n');

      console.log('3. Creating unique index on phone_number...');
      db.run(`
        CREATE UNIQUE INDEX idx_users_phone_number ON users(phone_number)
        WHERE phone_number IS NOT NULL
      `, (err) => {
        if (err) {
          console.error('Error creating unique index:', err);
          db.close();
          return;
        }

        console.log('   ✓ Unique index created successfully\n');

        console.log('========================================');
        console.log('   MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('========================================\n');
        console.log('Phone number authentication is now available.');
        console.log('- phone_number: Unique phone number for each user\n');

        db.close();
      });
    });
  });
});
