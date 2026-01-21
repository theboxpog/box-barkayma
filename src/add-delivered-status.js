const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('=== ADDING "DELIVERED" STATUS TO RESERVATIONS ===\n');

console.log('Step 1: Creating temporary table with updated constraint...');

db.serialize(() => {
  // Create a new table with the updated constraint
  db.run(`
    CREATE TABLE reservations_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tool_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'completed', 'delivered')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (tool_id) REFERENCES tools (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating new table:', err.message);
      db.close();
      return;
    }
    console.log('✅ New table created\n');

    console.log('Step 2: Copying data from old table...');
    db.run(`
      INSERT INTO reservations_new
      SELECT id, user_id, tool_id, start_date, end_date, total_price, status, created_at, quantity
      FROM reservations
    `, (err) => {
      if (err) {
        console.error('Error copying data:', err.message);
        db.close();
        return;
      }
      console.log('✅ Data copied\n');

      console.log('Step 3: Dropping old table...');
      db.run('DROP TABLE reservations', (err) => {
        if (err) {
          console.error('Error dropping old table:', err.message);
          db.close();
          return;
        }
        console.log('✅ Old table dropped\n');

        console.log('Step 4: Renaming new table...');
        db.run('ALTER TABLE reservations_new RENAME TO reservations', (err) => {
          if (err) {
            console.error('Error renaming table:', err.message);
            db.close();
            return;
          }
          console.log('✅ Table renamed\n');

          console.log('Step 5: Verifying the change...');
          db.run('UPDATE reservations SET status = ? WHERE id = 4', ['delivered'], function(err) {
            if (err) {
              console.error('❌ Verification failed:', err.message);
            } else {
              console.log(`✅ Successfully updated ${this.changes} row(s) to "delivered" status`);

              db.get('SELECT id, status FROM reservations WHERE id = 4', [], (err, row) => {
                if (row) {
                  console.log(`   Reservation 4 status: ${row.status}\n`);
                }

                console.log('==============================================');
                console.log('✅ MIGRATION COMPLETE!');
                console.log('==============================================');
                console.log('\nThe reservations table now accepts "delivered" status.');
                console.log('You can now use the "Mark Delivered" button in the admin panel.');
                console.log('\nPlease RESTART THE BACKEND SERVER for changes to take effect!');

                db.close();
              });
            }
          });
        });
      });
    });
  });
});
