CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,            -- kode barang (bisa untuk scan barcode/foto)
  name TEXT NOT NULL,          -- nama barang
  purchase_price REAL,         -- harga beli
  selling_price REAL,          -- harga jual satuan
  package_price REAL,          -- harga jual paket (opsional)
  package_qty INTEGER,         -- isi paket (misal: 1 dus = 12 pcs)
  discount REAL DEFAULT 0,     -- diskon %
  stock INTEGER DEFAULT 0,     -- jumlah stok barang
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL -- contoh: Tunai, Debit, E-Wallet, QRIS
);

CREATE TABLE IF NOT EXISTS shop_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,           -- nama toko
  footer_note TEXT     -- catatan kaki di struk
);

