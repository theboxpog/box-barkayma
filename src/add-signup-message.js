const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('========================================');
console.log('   ADDING SIGNUP MESSAGE COLUMN');
console.log('========================================\n');

db.serialize(() => {
  console.log('1. Adding signup_message column...');
  db.run(`ALTER TABLE contact_info ADD COLUMN signup_message TEXT DEFAULT 'Welcome to our Tool Rental service! We are excited to have you on board. Browse our extensive collection of tools and equipment for all your project needs.'`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column')) {
        console.log('   ✓ Column already exists, skipping\n');
      } else {
        console.error('   ✗ Error:', err.message);
      }
    } else {
      console.log('   ✓ Column added successfully\n');
    }

    console.log('========================================');
    console.log('   MIGRATION COMPLETED!');
    console.log('========================================\n');

    db.close();
  });
});
