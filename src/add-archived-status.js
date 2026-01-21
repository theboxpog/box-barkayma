const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('========================================');
console.log('   ADDING ARCHIVED STATUS');
console.log('========================================\n');

db.serialize(() => {
  console.log('1. Creating backup of reservations table...');
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations_backup AS
    SELECT * FROM reservations
  `, (err) => {
    if (err) {
      console.error('Error creating backup:', err);
      db.close();
      return;
    }
    console.log('   ✓ Backup created successfully\n');

    console.log('2. Dropping old reservations table...');
    db.run(`DROP TABLE reservations`, (err) => {
      if (err) {
        console.error('Error dropping table:', err);
        db.close();
        return;
      }
      console.log('   ✓ Table dropped\n');

      console.log('3. Creating new reservations table with archived status...');
      db.run(`
        CREATE TABLE reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          tool_id INTEGER NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_price REAL NOT NULL,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'completed', 'delivered', 'returned', 'overdue', 'archived')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          quantity INTEGER DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (tool_id) REFERENCES tools(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating new table:', err);
          db.close();
          return;
        }
        console.log('   ✓ New table created\n');

        console.log('4. Restoring data from backup...');
        db.run(`
          INSERT INTO reservations (id, user_id, tool_id, start_date, end_date, total_price, status, created_at, quantity)
          SELECT id, user_id, tool_id, start_date, end_date, total_price, status, created_at, quantity
          FROM reservations_backup
        `, (err) => {
          if (err) {
            console.error('Error restoring data:', err);
            db.close();
            return;
          }
          console.log('   ✓ Data restored\n');

          console.log('5. Dropping backup table...');
          db.run(`DROP TABLE reservations_backup`, (err) => {
            if (err) {
              console.error('Error dropping backup:', err);
            } else {
              console.log('   ✓ Backup dropped\n');
            }

            console.log('========================================');
            console.log('   MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('========================================\n');
            console.log('Archived status has been added to reservations table.\n');

            db.close();
          });
        });
      });
    });
  });
});
