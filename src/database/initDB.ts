import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// koneksi database utama dengan proteksi race condition
export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const database = await SQLite.openDatabaseAsync("kasir.db");

      // Inisialisasi tabel secara berurutan
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE,
          name TEXT NOT NULL,
          purchase_price REAL,
          purchase_package_price REAL,
          purchase_package_qty INTEGER,
          selling_price REAL,
          package_price REAL,
          package_qty INTEGER,
          discount REAL DEFAULT 0,
          stock INTEGER DEFAULT 0,
          created_at TEXT,
          updated_at TEXT
        );
      `);

      // Migrasi kolom produk yang baru
      try {
        await database.execAsync("ALTER TABLE products ADD COLUMN purchase_package_price REAL;");
      } catch (e) {}
      try {
        await database.execAsync("ALTER TABLE products ADD COLUMN purchase_package_qty INTEGER;");
      } catch (e) {}

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          created_at TEXT,
          updated_at TEXT
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS shop_profile (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          footer_note TEXT,
          cashier_name TEXT
        );
      `);

      // Migrasi kolom shop_profile
      try {
        await database.execAsync("ALTER TABLE shop_profile ADD COLUMN cashier_name TEXT;");
      } catch (e) {}

      await database.execAsync(`
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

      await database.execAsync(`
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

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          created_at TEXT,
          updated_at TEXT
        );
      `);

      // Migration for purchases
      try {
        await database.execAsync("ALTER TABLE purchases ADD COLUMN supplier_id INTEGER;");
      } catch (e) {}

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS purchases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          supplier_id INTEGER,
          supplier TEXT,
          total REAL,
          created_at TEXT,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS purchase_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          purchase_id INTEGER,
          product_id INTEGER,
          qty INTEGER,
          price REAL,
          subtotal REAL,
          FOREIGN KEY (purchase_id) REFERENCES purchases(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS receivables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER,
          customer_id INTEGER,
          amount REAL,
          due_date TEXT,
          status TEXT DEFAULT 'pending',
          FOREIGN KEY (sale_id) REFERENCES sales(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS payables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          purchase_id INTEGER,
          supplier_id INTEGER,
          supplier TEXT,
          amount REAL,
          due_date TEXT,
          status TEXT DEFAULT 'pending',
          FOREIGN KEY (purchase_id) REFERENCES purchases(id),
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        );
      `);

      // Migration for payables
      try {
        await database.execAsync("ALTER TABLE payables ADD COLUMN supplier_id INTEGER;");
      } catch (e) {}

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS phone_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT DEFAULT 'PULSA',
          phone_number TEXT,
          customer_name TEXT,
          provider TEXT,
          amount REAL,
          cost_price REAL,
          selling_price REAL,
          profit REAL,
          notes TEXT,
          created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS digital_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          provider TEXT NOT NULL,
          name TEXT NOT NULL,
          nominal REAL,
          cost_price REAL,
          selling_price REAL,
          created_at TEXT
        );
      `);

      // Migrations for digital transactions
      try {
        await database.execAsync("ALTER TABLE phone_history ADD COLUMN customer_name TEXT;");
      } catch (e) {}
      try {
        await database.execAsync("ALTER TABLE phone_history ADD COLUMN category TEXT DEFAULT 'PULSA';");
      } catch (e) {}
      try {
        await database.execAsync("ALTER TABLE phone_history ADD COLUMN notes TEXT;");
      } catch (e) {}

      db = database;
      console.log("✅ Database initialized successfully");
      return database;
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }
  })();

  return initPromise;
};

// inisialisasi tabel (hanya wrapper untuk kompabilitas)
export const initDatabase = async (): Promise<void> => {
  await getDB();
};
