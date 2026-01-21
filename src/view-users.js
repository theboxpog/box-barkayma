const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_database.db');

console.log('=== ALL USERS IN DATABASE ===\n');

db.all('SELECT id, name, email, role, created_at FROM users ORDER BY id', [], (err, users) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  if (users.length === 0) {
    console.log('No users found in database.');
  } else {
    console.log(`Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()} Account`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    // Count by role
    const admins = users.filter(u => u.role === 'admin').length;
    const regularUsers = users.filter(u => u.role === 'user').length;

    console.log('=== SUMMARY ===');
    console.log(`Total Users: ${users.length}`);
    console.log(`Admins: ${admins}`);
    console.log(`Regular Users: ${regularUsers}`);
  }

  db.close();
});
