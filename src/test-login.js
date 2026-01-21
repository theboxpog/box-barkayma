const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./rental_database.db');

console.log('=== Testing Admin Login ===\n');

// Check if admin user exists
db.get('SELECT * FROM users WHERE email = ?', ['admin@toolrental.com'], async (err, user) => {
  if (err) {
    console.error('❌ Database error:', err);
    db.close();
    return;
  }

  if (!user) {
    console.log('❌ Admin user not found in database!');
    console.log('\nCreating admin user now...\n');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@toolrental.com', hashedPassword, 'admin'],
      function(err) {
        if (err) {
          console.error('❌ Error creating admin:', err);
        } else {
          console.log('✅ Admin user created successfully!');
          console.log('\nLogin credentials:');
          console.log('Email: admin@toolrental.com');
          console.log('Password: admin123');
        }
        db.close();
      }
    );
  } else {
    console.log('✅ Admin user found in database!\n');
    console.log('User Details:');
    console.log('  ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);

    // Test password
    bcrypt.compare('admin123', user.password_hash, (err, isMatch) => {
      if (err) {
        console.error('\n❌ Error testing password:', err);
      } else if (isMatch) {
        console.log('\n✅ Password "admin123" is CORRECT!\n');
        console.log('=== Login should work with: ===');
        console.log('Email: admin@toolrental.com');
        console.log('Password: admin123');
      } else {
        console.log('\n❌ Password "admin123" does NOT match!\n');
        console.log('Resetting password to "admin123"...');

        bcrypt.hash('admin123', 10, (err, newHash) => {
          if (err) {
            console.error('Error hashing password:', err);
            db.close();
            return;
          }

          db.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newHash, user.id],
            (err) => {
              if (err) {
                console.error('❌ Error updating password:', err);
              } else {
                console.log('✅ Password reset successfully!');
                console.log('\nYou can now login with:');
                console.log('Email: admin@toolrental.com');
                console.log('Password: admin123');
              }
              db.close();
            }
          );
        });
        return;
      }
      db.close();
    });
  }
});
