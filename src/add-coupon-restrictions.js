const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('========================================');
console.log('   ADDING COUPON RESTRICTION COLUMNS');
console.log('========================================\n');

db.serialize(() => {
  console.log('1. Adding allowed_categories column...');
  db.run(`ALTER TABLE coupons ADD COLUMN allowed_categories TEXT DEFAULT NULL`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column')) {
        console.log('   ✓ Column already exists, skipping\n');
      } else {
        console.error('   ✗ Error:', err.message);
      }
    } else {
      console.log('   ✓ Column added successfully\n');
    }

    console.log('2. Adding allowed_tools column...');
    db.run(`ALTER TABLE coupons ADD COLUMN allowed_tools TEXT DEFAULT NULL`, (err) => {
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
      console.log('New columns added:');
      console.log('- allowed_categories: Comma-separated list of allowed categories');
      console.log('- allowed_tools: Comma-separated list of allowed tool IDs\n');

      db.close();
    });
  });
});
