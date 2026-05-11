/**
 * One-time migration: copies all data from local SQLite → Turso
 * Run once: node migrate-to-turso.js
 */
require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('path');

const DB_PATH = path.join(__dirname, 'rental_database.db');
const local = createClient({ url: `file:${DB_PATH}` });
const turso = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN });

async function readAll(table) {
  const result = await local.execute(`SELECT * FROM ${table}`);
  return {
    columns: result.columns,
    rows: result.rows.map(row => {
      const obj = {};
      for (const col of result.columns) obj[col] = row[col] ?? null;
      return obj;
    })
  };
}

async function insertRows(table, columns, rows) {
  if (!rows.length) { console.log(`  ${table}: 0 rows`); return; }
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  for (const row of rows) {
    const args = columns.map(c => row[c] === undefined ? null : row[c]);
    await turso.execute({ sql, args });
  }
  console.log(`  ${table}: ${rows.length} rows migrated`);
}

async function migrate() {
  console.log('Dropping old tables in Turso (clean slate)...');
  const dropOrder = [
    'pending_bit_orders','payment_sessions','payments','reservations',
    'coupons','rental_settings','contact_info','tools','users'
  ];
  for (const t of dropOrder) {
    await turso.execute(`DROP TABLE IF EXISTS ${t}`).catch(() => {});
  }

  console.log('Creating tables with correct schema...');

  await turso.execute(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password_hash TEXT NOT NULL,
    google_id TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'subadmin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await turso.execute(`CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price_per_day REAL NOT NULL,
    description TEXT,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    stock INTEGER DEFAULT 1
  )`);

  await turso.execute(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tool_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'active',
    previous_status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await turso.execute(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    success INTEGER DEFAULT 0,
    stripe_payment_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await turso.execute(`CREATE TABLE IF NOT EXISTS contact_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL DEFAULT 'contact@toolrental.com',
    phone TEXT NOT NULL DEFAULT '+972 50-123-4567',
    address TEXT NOT NULL DEFAULT '123 Tool Street, Tel Aviv, Israel',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    signup_message TEXT DEFAULT '',
    email_important_message TEXT DEFAULT '',
    privacy_policy TEXT DEFAULT NULL,
    checkout_success_message TEXT DEFAULT '',
    checkout_success_message_he TEXT DEFAULT ''
  )`);

  await turso.execute(`CREATE TABLE IF NOT EXISTS rental_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await turso.execute(`CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
    discount_value REAL NOT NULL,
    min_order_value REAL DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    expiry_date DATE DEFAULT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    allowed_categories TEXT DEFAULT NULL,
    allowed_tools TEXT DEFAULT NULL
  )`);

  await turso.execute(`CREATE TABLE IF NOT EXISTS payment_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    cart_data TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await turso.execute(`CREATE TABLE IF NOT EXISTS pending_bit_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    identifier TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    cart_data TEXT NOT NULL,
    customer_data TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('\nMigrating data...');

  // Order matters — foreign keys first
  const tables = [
    'users', 'tools', 'contact_info', 'rental_settings', 'coupons',
    'reservations', 'payments', 'payment_sessions', 'pending_bit_orders'
  ];

  for (const table of tables) {
    try {
      const { columns, rows } = await readAll(table);
      await insertRows(table, columns, rows);
    } catch (err) {
      console.warn(`  ${table}: SKIPPED — ${err.message}`);
    }
  }

  console.log('\nMigration complete! All data is now in Turso.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
