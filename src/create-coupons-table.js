const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('========================================');
console.log('   CREATING COUPONS TABLE');
console.log('========================================\n');

db.serialize(() => {
  console.log('1. Checking if coupons table already exists...');

  db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='coupons'`, [], (err, row) => {
    if (err) {
      console.error('Error checking table:', err);
      db.close();
      return;
    }

    if (row) {
      console.log('   ✓ Coupons table already exists, skipping creation\n');
      db.close();
      return;
    }

    console.log('   ✓ Table does not exist, proceeding with creation\n');

    console.log('2. Creating coupons table...');
    db.run(`
      CREATE TABLE coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
        discount_value REAL NOT NULL,
        min_order_value REAL DEFAULT 0,
        max_uses INTEGER DEFAULT NULL,
        used_count INTEGER DEFAULT 0,
        expiry_date DATE DEFAULT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err);
        db.close();
        return;
      }
      console.log('   ✓ Coupons table created successfully\n');

      console.log('3. Creating sample coupon for testing...');
      db.run(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, is_active)
        VALUES ('WELCOME10', 'percentage', 10, 0, 1)
      `, (err) => {
        if (err) {
          console.error('Error creating sample coupon:', err);
        } else {
          console.log('   ✓ Sample coupon created: WELCOME10 (10% off)\n');
        }

        console.log('========================================');
        console.log('   MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('========================================\n');
        console.log('Coupons table has been created with the following fields:');
        console.log('- code: Unique coupon code');
        console.log('- discount_type: "percentage" or "fixed"');
        console.log('- discount_value: Amount or percentage');
        console.log('- min_order_value: Minimum order required');
        console.log('- max_uses: Maximum times coupon can be used');
        console.log('- used_count: Current usage count');
        console.log('- expiry_date: Expiration date (optional)');
        console.log('- is_active: Whether coupon is active\n');

        db.close();
      });
    });
  });
});
