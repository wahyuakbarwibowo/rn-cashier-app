CREATE TABLE IF NOT EXISTS receivables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  amount REAL,
  due_date TEXT,
  status TEXT DEFAULT 'unpaid',
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS payables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier TEXT,
  amount REAL,
  due_date TEXT,
  status TEXT DEFAULT 'unpaid'
);

CREATE TABLE IF NOT EXISTS phone_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE,
  last_used_at TEXT
);

