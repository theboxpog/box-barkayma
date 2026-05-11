const { createClient } = require('@libsql/client');

const dbUrl = process.env.TURSO_URL || 'file:rental_database.db';
console.log('🗄️  DB connecting to:', dbUrl);

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_TOKEN,
});

// Convert a libsql Row to a plain JS object using result.columns
function rowToObj(row, columns) {
  const obj = {};
  for (const col of columns) {
    obj[col] = row[col] ?? null;
  }
  return obj;
}

// sqlite3-compatible wrapper so all existing routes work unchanged
const db = {
  run(sql, params, callback) {
    const args = Array.isArray(params) ? params.map(v => v === undefined ? null : v) : [];
    const cb = typeof params === 'function' ? params : (callback || null);
    client.execute({ sql, args })
      .then(result => {
        if (cb) cb.call({
          lastID: Number(result.lastInsertRowid ?? 0),
          changes: result.rowsAffected ?? 0
        }, null);
      })
      .catch(err => { if (cb) cb(err); });
  },

  get(sql, params, callback) {
    const args = Array.isArray(params) ? params.map(v => v === undefined ? null : v) : [];
    const cb = typeof params === 'function' ? params : (callback || null);
    client.execute({ sql, args })
      .then(result => {
        const row = result.rows[0] ? rowToObj(result.rows[0], result.columns) : null;
        if (cb) cb(null, row);
      })
      .catch(err => { if (cb) cb(err); });
  },

  all(sql, params, callback) {
    const args = Array.isArray(params) ? params.map(v => v === undefined ? null : v) : [];
    const cb = typeof params === 'function' ? params : (callback || null);
    client.execute({ sql, args })
      .then(result => {
        const rows = result.rows.map(r => rowToObj(r, result.columns));
        if (cb) cb(null, rows);
      })
      .catch(err => { if (cb) cb(err); });
  },

  serialize(callback) {
    if (callback) callback();
  }
};

async function initializeDatabase() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone_number TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'subadmin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_per_day REAL NOT NULL,
      description TEXT,
      image_url TEXT,
      quantity INTEGER DEFAULT 1,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tool_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      quantity INTEGER DEFAULT 1,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'active',
      previous_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (tool_id) REFERENCES tools(id)
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      success INTEGER DEFAULT 0,
      stripe_payment_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS contact_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL DEFAULT 'contact@toolrental.com',
      phone TEXT NOT NULL DEFAULT '+972 50-123-4567',
      address TEXT NOT NULL DEFAULT '123 Tool Street, Tel Aviv, Israel',
      email_important_message TEXT DEFAULT '',
      checkout_success_message TEXT DEFAULT '',
      checkout_success_message_he TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS payment_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      cart_data TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_value REAL NOT NULL,
      applies_to TEXT DEFAULT 'all',
      category TEXT,
      min_order_value REAL DEFAULT 0,
      max_uses INTEGER,
      uses_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  // Insert defaults if not exist
  await client.execute(
    `INSERT OR IGNORE INTO contact_info (id, email, phone, address)
     VALUES (1, 'contact@toolrental.com', '+972 50-123-4567', '123 Tool Street, Tel Aviv, Israel')`
  );

  console.log('Database tables initialized (Turso)');
}

initializeDatabase().catch(err => console.error('DB init error:', err));

module.exports = db;
