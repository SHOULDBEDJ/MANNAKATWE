import { db } from './client.js';

const tables = `
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT,
    phone TEXT,
    alt_phone TEXT,
    address TEXT,
    photo_url TEXT
  );
  CREATE TABLE IF NOT EXISTS customer_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alt_phone TEXT,
    address TEXT,
    type_id INTEGER REFERENCES customer_types(id),
    notes TEXT,
    customer_uid TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS function_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS expense_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    place TEXT,
    booking_date TEXT,
    delivery_date TEXT,
    delivery_time TEXT,
    return_date TEXT,
    return_time TEXT,
    function_type_id INTEGER REFERENCES function_types(id),
    total_amount REAL,
    delivery_amount REAL,
    discount_amount REAL,
    partial_amount REAL,
    sub_total REAL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'Pending',
    booking_status TEXT DEFAULT 'Confirmed',
    customer_type_id INTEGER REFERENCES customer_types(id),
    items_json TEXT,
    is_returned INTEGER DEFAULT 0,
    damage_amount REAL DEFAULT 0,
    damage_notes TEXT,
    notes TEXT,
    booking_uid TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS booking_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_type_id INTEGER REFERENCES expense_types(id),
    booking_id INTEGER REFERENCES bookings(id),
    amount REAL,
    photo_url TEXT,
    notes TEXT,
    expense_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS gallery_albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cover_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS gallery_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS upi_ids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    upi_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_method TEXT,
    upi_id TEXT,
    paid_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS kpi_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kpi_key TEXT NOT NULL UNIQUE,
    is_visible INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS booking_voice_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    permissions TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

await db.executeMultiple(tables);

// Patch existing database with missing columns
const patchColumns = [
  { name: 'is_returned', type: 'INTEGER DEFAULT 0' },
  { name: 'damage_amount', type: 'REAL DEFAULT 0' },
  { name: 'damage_notes', type: 'TEXT' },
  { name: 'items_json', type: 'TEXT' },
  { name: 'customer_uid', type: 'TEXT UNIQUE' },
  { name: 'booking_uid', type: 'TEXT UNIQUE' }
];

for (const col of patchColumns) {
  try {
    await db.execute(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`);
    console.log(`Patched column: ${col.name}`);
  } catch (err) {
    // Ignore error if column already exists
  }
}

await db.execute(`INSERT OR IGNORE INTO customer_types (id, name) VALUES (1, 'Regular Chief'), (2, 'Other Business Owner')`);

const kpis = [
  'total_bookings','todays_deliveries','upcoming_deliveries',
  'pending_payments','total_revenue','pending_amount',
  'total_expenses','monthly_revenue','draft_bookings'
];
for (let i = 0; i < kpis.length; i++) {
  await db.execute({
    sql: `INSERT OR IGNORE INTO kpi_config (kpi_key, is_visible, display_order) VALUES (?, 1, ?)`,
    args: [kpis[i], i]
  });
}

await db.execute(`INSERT OR IGNORE INTO users (username, password, permissions) VALUES ('manna123', 'manna123', 'all')`);

console.log('All tables created. Seed data inserted.');
process.exit(0);
