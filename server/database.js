const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'lavish_latrines.db');
let _sqlDb = null;

// ── Persist the in-memory database to disk after every write ──
function saveDb() {
  if (_sqlDb) {
    fs.writeFileSync(DB_PATH, Buffer.from(_sqlDb.export()));
  }
}

// ── Statement wrapper that mimics better-sqlite3's synchronous API ──
class Statement {
  constructor(sql) {
    this._sql = sql;
  }

  _params(args) {
    if (args.length === 0) return [];
    if (args.length === 1 && Array.isArray(args[0])) return args[0];
    return args;
  }

  get(...args) {
    const params = this._params(args);
    const stmt = _sqlDb.prepare(this._sql);
    try {
      if (params.length) stmt.bind(params);
      return stmt.step() ? stmt.getAsObject() : undefined;
    } finally {
      stmt.free();
    }
  }

  all(...args) {
    const params = this._params(args);
    const rows = [];
    const stmt = _sqlDb.prepare(this._sql);
    try {
      if (params.length) stmt.bind(params);
      while (stmt.step()) rows.push(stmt.getAsObject());
    } finally {
      stmt.free();
    }
    return rows;
  }

  run(...args) {
    const params = this._params(args);
    _sqlDb.run(this._sql, params.length ? params : undefined);
    const lastInsertRowid = _sqlDb.exec('SELECT last_insert_rowid()')[0]?.values[0][0] || 0;
    const changes = _sqlDb.getRowsModified();
    saveDb();
    return { lastInsertRowid, changes };
  }
}

// ── DB wrapper object — same API as better-sqlite3 ──
const db = {
  prepare: (sql) => new Statement(sql),
  exec:    (sql) => { _sqlDb.exec(sql); saveDb(); },
  pragma:  ()    => {}  // sql.js handles pragmas internally; safe no-op
};

// ── Schema ──
function initSchema() {
  _sqlDb.exec(`
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
  saveDb();

  // Seed default accounts if none exist
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run('Owner', 'admin@lavishlatrines.com', adminHash, 'admin');

    const staffHash = bcrypt.hashSync('staff123', 10);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run('Staff Member', 'staff@lavishlatrines.com', staffHash, 'employee');

    console.log('✓ Default accounts created');
    console.log('  Admin: admin@lavishlatrines.com / admin123');
    console.log('  Staff: staff@lavishlatrines.com / staff123');
  }
}

// ── Initialize (async because sql.js loads WASM) ──
async function initDb() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, 'node_modules/sql.js/dist', file)
  });

  if (fs.existsSync(DB_PATH)) {
    _sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('✓ Loaded existing database');
  } else {
    _sqlDb = new SQL.Database();
    console.log('✓ Created new database');
  }

  initSchema();
  return db;
}

function getDb() {
  if (!_sqlDb) throw new Error('Database not initialized — call initDb() first');
  return db;
}

module.exports = { initDb, getDb };
