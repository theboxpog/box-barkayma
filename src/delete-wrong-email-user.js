const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('=== Deleting User with Wrong Email ===\n');

const wrongEmail = 'yshayu000@gmail.com'; // 3 zeros

// First, check if the user exists
db.get(
  'SELECT id, name, email FROM users WHERE email = ?',
  [wrongEmail],
  (err, user) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    if (!user) {
      console.log('❌ No user found with email:', wrongEmail);
      db.close();
      return;
    }

    console.log('Found user:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log('\nDeleting this user...\n');

    // Delete the user
    db.run(
      'DELETE FROM users WHERE email = ?',
      [wrongEmail],
      function(err) {
        if (err) {
          console.error('❌ Error deleting user:', err);
        } else {
          console.log('✅ User deleted successfully!');
          console.log(`   Rows affected: ${this.changes}`);
          console.log('\nYou can now sign up with the correct email:');
          console.log('   yshayu0000@gmail.com (4 zeros)\n');
        }
        db.close();
      }
    );
  }
);
