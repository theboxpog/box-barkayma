const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'subadmin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tools table
    db.run(`
      CREATE TABLE IF NOT EXISTS tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price_per_day REAL NOT NULL,
        description TEXT,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reservations table
    db.run(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tool_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tool_id) REFERENCES tools(id)
      )
    `);

    // Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        success INTEGER DEFAULT 0,
        stripe_payment_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reservation_id) REFERENCES reservations(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Contact Info table
    db.run(`
      CREATE TABLE IF NOT EXISTS contact_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL DEFAULT 'contact@toolrental.com',
        phone TEXT NOT NULL DEFAULT '+972 50-123-4567',
        address TEXT NOT NULL DEFAULT '123 Tool Street, Tel Aviv, Israel',
        email_important_message TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add email_important_message column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE contact_info ADD COLUMN email_important_message TEXT DEFAULT ''`, (err) => {
      // Ignore error if column already exists
    });

    // Insert default contact info if not exists
    db.run(`
      INSERT OR IGNORE INTO contact_info (id, email, phone, address)
      VALUES (1, 'contact@toolrental.com', '+972 50-123-4567', '123 Tool Street, Tel Aviv, Israel')
    `);

    console.log('Database tables initialized');
  });
}

module.exports = db;
