const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'lavish_latrines.db');
let _db = null;

// ── Promise helpers ──────────────────────────────────────────────────────────

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    _db.exec(sql, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── Safe column migration helper ─────────────────────────────────────────────

async function addColumnIfMissing(table, column, type) {
  try {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch (_) {
    // Column already exists — ignore
  }
}

// ── Schema ───────────────────────────────────────────────────────────────────

async function initSchema() {
  await exec(`
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

  // ── Migrations: add new columns to existing tables ──
  await addColumnIfMissing('bookings', 'water_access', 'TEXT');
  await addColumnIfMissing('bookings', 'power_access', 'TEXT');
  await addColumnIfMissing('bookings', 'expected_guests', 'TEXT');
  await addColumnIfMissing('bookings', 'address_details', 'TEXT');
  await addColumnIfMissing('bookings', 'created_by_admin', 'INTEGER DEFAULT 0');
  await addColumnIfMissing('quotes',   'water_access', 'TEXT');
  await addColumnIfMissing('quotes',   'power_access', 'TEXT');
  await addColumnIfMissing('quotes',   'address_details', 'TEXT');

  // ── Admin account: always sync from env vars on startup ──
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@lavishlatrines.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await get("SELECT * FROM users WHERE role = 'admin'");

  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    await run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Owner', adminEmail, hash, 'admin']);
    console.log(`✓ Admin account created: ${adminEmail}`);
  } else {
    // Update credentials if env vars differ from what's stored
    const emailChanged    = existingAdmin.email !== adminEmail;
    const passwordMatches = bcrypt.compareSync(adminPassword, existingAdmin.password_hash);
    if (emailChanged || !passwordMatches) {
      const hash = bcrypt.hashSync(adminPassword, 10);
      await run('UPDATE users SET email = ?, password_hash = ? WHERE id = ?',
        [adminEmail, hash, existingAdmin.id]);
      console.log(`✓ Admin credentials updated: ${adminEmail}`);
    }
  }

  // Seed default staff if none exist
  const staffExists = await get("SELECT id FROM users WHERE role = 'employee'");
  if (!staffExists) {
    const hash = bcrypt.hashSync('staff123', 10);
    await run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Staff Member', 'staff@lavishlatrines.com', hash, 'employee']);
    console.log('✓ Default staff account created: staff@lavishlatrines.com / staff123');
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function initDb() {
  return new Promise((resolve, reject) => {
    _db = new sqlite3.Database(DB_PATH, async err => {
      if (err) { reject(err); return; }
      console.log('✓ Database connected');
      try {
        await initSchema();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

function getDb() {
  return { run, get, all, exec };
}

module.exports = { initDb, getDb };
