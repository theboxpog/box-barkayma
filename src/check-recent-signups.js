const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('=== Checking Recent User Signups ===\n');

// Get the 5 most recent users
db.all(
  `SELECT id, name, email, phone_number, role, created_at
   FROM users
   ORDER BY id DESC
   LIMIT 5`,
  [],
  (err, users) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    console.log(`Found ${users.length} recent users:\n`);
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Phone: ${user.phone_number}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.created_at || 'N/A'}`);
      console.log('---');
    });

    // Check specifically for yshayu000@gmail.com (3 zeros)
    console.log('\nChecking for yshayu000@gmail.com:');
    db.get(
      `SELECT id, name, email FROM users WHERE email = ?`,
      ['yshayu000@gmail.com'],
      (err, user) => {
        if (err) {
          console.error('Error:', err);
        } else if (user) {
          console.log('✅ Found user with this email!');
          console.log(`   ID: ${user.id}, Name: ${user.name}`);
        } else {
          console.log('❌ No user found with this email');
        }

        // Check for yshayu0000@gmail.com (4 zeros)
        console.log('\nChecking for yshayu0000@gmail.com:');
        db.get(
          `SELECT id, name, email FROM users WHERE email = ?`,
          ['yshayu0000@gmail.com'],
          (err, user) => {
            if (err) {
              console.error('Error:', err);
            } else if (user) {
              console.log('✅ Found user with this email!');
              console.log(`   ID: ${user.id}, Name: ${user.name}`);
            } else {
              console.log('❌ No user found with this email');
            }

            db.close();
          }
        );
      }
    );
  }
);
