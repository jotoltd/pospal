import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "pos.db");

function getDb(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT DEFAULT '',
      available INTEGER DEFAULT 1,
      stock_count INTEGER DEFAULT -1,
      track_stock INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      modifiers TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT DEFAULT '',
      customer_phone TEXT DEFAULT '',
      order_type TEXT NOT NULL DEFAULT 'collection',
      status TEXT NOT NULL DEFAULT 'pending',
      subtotal REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      table_number TEXT DEFAULT '',
      delivery_address TEXT DEFAULT '',
      staff_id INTEGER,
      refund_amount REAL DEFAULT 0,
      refund_reason TEXT DEFAULT '',
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT DEFAULT '',
      modifiers TEXT DEFAULT '[]',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- Parked/Hold Orders - saved for later
    CREATE TABLE IF NOT EXISTS parked_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_name TEXT NOT NULL,
      customer_name TEXT DEFAULT '',
      customer_phone TEXT DEFAULT '',
      order_type TEXT DEFAULT 'collection',
      table_number TEXT DEFAULT '',
      delivery_address TEXT DEFAULT '',
      subtotal REAL NOT NULL,
      tax REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      delivery_fee REAL NOT NULL DEFAULT 0,
      service_charge REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      notes TEXT DEFAULT '',
      items TEXT NOT NULL, -- JSON array of cart items
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Cash Drawer Sessions for end-of-day reconciliation
    CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER,
      start_time TEXT DEFAULT (datetime('now')),
      end_time TEXT,
      opening_balance REAL NOT NULL,
      expected_balance REAL,
      actual_balance REAL,
      difference REAL,
      status TEXT DEFAULT 'open', -- open, closed
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    -- Cash transactions (float in/out, paid outs)
    CREATE TABLE IF NOT EXISTS cash_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- float_in, float_out, paid_out, tips
      amount REAL NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES cash_drawer_sessions(id)
    );

    -- Order status history for tracking workflow
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL, -- pending, preparing, ready, out_for_delivery, delivered, completed
      staff_id INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      is_manager INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT DEFAULT '',
      staff_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      is_vip INTEGER DEFAULT 0,
      allergies TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discount_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'percentage',
      value REAL NOT NULL,
      min_order_value REAL DEFAULT 0,
      max_uses INTEGER DEFAULT NULL,
      uses_count INTEGER DEFAULT 0,
      valid_from TEXT DEFAULT (datetime('now')),
      valid_until TEXT DEFAULT NULL,
      is_happy_hour INTEGER DEFAULT 0,
      happy_hour_start TEXT DEFAULT NULL,
      happy_hour_end TEXT DEFAULT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Insert default settings if not present
    INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_name', 'My Takeaway');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_address', '123 High Street');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_phone', '0123 456789');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('tax_rate', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_symbol', '£');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('printer_type', 'thermal');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('printer_width', '25');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('printer_brand', 'generic');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_print', '1');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('order_counter', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('setup_complete', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('cash_drawer_enabled', '1');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('cash_drawer_on_card', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('kitchen_printer', '');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('kitchen_printer_enabled', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('table_service_enabled', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('staff_login_required', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('manager_pin', '1234');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('current_staff_id', '');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('current_staff_name', '');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_open', '1');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_closed_message', 'Sorry, we are currently closed. Please come back during opening hours.');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('opening_monday', '11:00-22:00');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('opening_tuesday', '11:00-22:00');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('opening_wednesday', '11:00-22:00');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('opening_thursday', '11:00-22:00');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('opening_friday', '11:00-23:00');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('opening_saturday', '11:00-23:00');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('opening_sunday', '12:00-22:00');
    
    -- Delivery & Service Settings
    INSERT OR IGNORE INTO settings (key, value) VALUES ('delivery_fee_enabled', '0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('delivery_fee_amount', '2.50');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('service_charge_enabled', '1');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('service_charge_percent', '10');
    
    -- Branding Settings
    INSERT OR IGNORE INTO settings (key, value) VALUES ('logo_url', '');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('primary_color', 'hsl(24 95% 53%)');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('accent_color', 'hsl(280 60% 50%)');
  `);

  // Migrations for existing databases
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN delivery_address TEXT DEFAULT ''`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE menu_items ADD COLUMN modifiers TEXT DEFAULT '[]'`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE order_items ADD COLUMN modifiers TEXT DEFAULT '[]'`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE customers ADD COLUMN loyalty_points INTEGER DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE customers ADD COLUMN total_visits INTEGER DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN service_charge REAL DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN split_cash REAL DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN split_card REAL DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN loyalty_points_redeemed INTEGER DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN loyalty_points_earned INTEGER DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN transaction_code TEXT DEFAULT ''`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN tip REAL DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN discount_code TEXT DEFAULT ''`);
  } catch { /* column already exists */ }

  try {
    db.exec(`ALTER TABLE staff ADD COLUMN hourly_rate REAL DEFAULT 0`);
  } catch { /* column already exists */ }

  db.exec(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      staff_name TEXT NOT NULL,
      clock_in TEXT NOT NULL DEFAULT (datetime('now')),
      clock_out TEXT,
      duration_minutes INTEGER,
      notes TEXT DEFAULT '',
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );
  `);

  return db;
}

export default getDb;
