import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

// koneksi database
export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("kasir.db");
  }
  return db;
};

// inisialisasi tabel
export const initDatabase = async (): Promise<void> => {
  const db = await getDB();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      purchase_price REAL,
      selling_price REAL,
      package_price REAL,
      package_qty INTEGER,
      discount REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS shop_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      footer_note TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      payment_method_id INTEGER,
      total REAL,
      paid REAL,
      change REAL,
      created_at TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      qty INTEGER,
      price REAL,
      subtotal REAL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  console.log("✅ Database initialized (TypeScript)");
};
