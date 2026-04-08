const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'lavish_latrines.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id),
      trailer_number INTEGER NOT NULL,
      event_date TEXT NOT NULL,
      end_date TEXT,
      event_type TEXT,
      location TEXT,
      location_address TEXT,
      base_price REAL DEFAULT 1100.00,
      deposit_amount REAL DEFAULT 550.00,
      deposit_paid INTEGER DEFAULT 0,
      balance_due REAL DEFAULT 550.00,
      square_payment_id TEXT,
      square_receipt_url TEXT,
      payment_status TEXT DEFAULT 'pending',
      contract_signed INTEGER DEFAULT 0,
      signature_data TEXT,
      signed_at DATETIME,
      invoice_sent INTEGER DEFAULT 0,
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      event_type TEXT,
      requested_start TEXT,
      requested_end TEXT,
      num_trailers INTEGER DEFAULT 1,
      location TEXT,
      estimated_guests INTEGER,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      estimated_price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      quote_id INTEGER,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      type TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin user if none exists
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('Owner', 'admin@lavishlatrines.com', hash, 'admin');

    const empHash = bcrypt.hashSync('staff123', 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('Staff Member', 'staff@lavishlatrines.com', empHash, 'employee');

    console.log('✓ Default admin and staff accounts created');
    console.log('  Admin:  admin@lavishlatrines.com / admin123');
    console.log('  Staff:  staff@lavishlatrines.com / staff123');
  }
}

module.exports = { getDb };
