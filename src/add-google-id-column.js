const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('=== ADDING GOOGLE_ID COLUMN TO USERS TABLE ===\n');

db.serialize(() => {
  // Check if the column already exists
  db.all("PRAGMA table_info(users)", [], (err, columns) => {
    if (err) {
      console.error('Error checking table structure:', err);
      db.close();
      return;
    }

    const hasGoogleId = columns.some(col => col.name === 'google_id');

    if (hasGoogleId) {
      console.log('✅ google_id column already exists. No migration needed.');
      db.close();
      return;
    }

    console.log('Adding google_id column...');

    db.run(
      'ALTER TABLE users ADD COLUMN google_id TEXT',
      (err) => {
        if (err) {
          console.error('❌ Error adding column:', err.message);
          db.close();
          return;
        }

        console.log('✅ Successfully added google_id column to users table\n');
        console.log('==============================================');
        console.log('✅ MIGRATION COMPLETE!');
        console.log('==============================================');
        console.log('\nThe users table now supports Google authentication.');
        console.log('Please RESTART THE BACKEND SERVER for changes to take effect!');

        db.close();
      }
    );
  });
});
