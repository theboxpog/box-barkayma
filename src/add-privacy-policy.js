const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Checking if contact_info table exists...');

  // First, create the contact_info table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      phone TEXT,
      address TEXT,
      signup_message TEXT,
      privacy_policy TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating contact_info table:', err.message);
      db.close();
      return;
    }

    console.log('contact_info table ready');

    // Check if there's already a row, if not insert default values
    db.get('SELECT id FROM contact_info WHERE id = 1', (err, row) => {
      if (err) {
        console.error('Error checking contact_info:', err.message);
        db.close();
        return;
      }

      const defaultPolicy = `# Privacy Policy

Last Updated: December 24, 2025

## 1. Information We Collect

We collect personal information when you create an account, including:
- Full name
- Email address
- Phone number
- Rental history and preferences

## 2. How We Use Your Information

We use your information to:
- Process tool rentals and reservations
- Send rental confirmations and reminders
- Improve our services
- Comply with legal obligations

## 3. Data Security

We implement industry-standard security measures to protect your data.

## 4. Your Rights

You have the right to access, correct, or delete your personal information.

## 5. Contact Us

For privacy concerns, contact us at privacy@toolrental.com`;

      if (!row) {
        // Insert default row
        console.log('Inserting default contact info...');
        db.run(`
          INSERT INTO contact_info (email, phone, address, signup_message, privacy_policy)
          VALUES (?, ?, ?, ?, ?)
        `, [
          'contact@toolrental.com',
          '+972 50-123-4567',
          '123 Tool Street, Tel Aviv, Israel',
          'Welcome to our Tool Rental service! We are excited to have you on board.',
          defaultPolicy
        ], (err) => {
          if (err) {
            console.error('Error inserting default values:', err.message);
          } else {
            console.log('Default contact info inserted successfully');
          }
          db.close();
        });
      } else {
        // Update existing row to add privacy policy if it doesn't have one
        console.log('Updating existing contact info with privacy policy...');
        db.run(`
          UPDATE contact_info
          SET privacy_policy = COALESCE(privacy_policy, ?)
          WHERE id = 1
        `, [defaultPolicy], (err) => {
          if (err) {
            console.error('Error updating privacy policy:', err.message);
          } else {
            console.log('Privacy policy updated successfully');
          }
          db.close();
        });
      }
    });
  });
});
