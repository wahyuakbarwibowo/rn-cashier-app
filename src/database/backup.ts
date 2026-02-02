import { getDB } from "./initDB";

const TABLES = [
  "products",
  "customers",
  "payment_methods",
  "shop_profile",
  "sales",
  "sales_items",
  "suppliers",
  "purchases",
  "purchase_items",
  "receivables",
  "payables",
  "phone_history",
  "digital_products",
  "digital_categories"
];

export const exportFullData = async () => {
  const db = await getDB();
  const backupData: Record<string, any[]> = {};

  for (const table of TABLES) {
    const data = await db.getAllAsync(`SELECT * FROM ${table}`);
    backupData[table] = data;
  }

  return {
    version: "1.0",
    timestamp: new Date().toISOString(),
    data: backupData
  };
};

export const importFullData = async (backupJson: any) => {
  const db = await getDB();
  
  if (!backupJson.data || typeof backupJson.data !== 'object') {
    throw new Error("Invalid backup format");
  }

  // Use a transaction for safety
  await db.withTransactionAsync(async () => {
    // 1. Clear all existing data
    for (const table of TABLES) {
      await db.runAsync(`DELETE FROM ${table}`);
      // Reset autoincrement
      await db.runAsync(`DELETE FROM sqlite_sequence WHERE name = ?`, [table]);
    }

    // 2. Insert data back
    const data = backupJson.data;
    for (const table of TABLES) {
      const rows = data[table];
      if (!rows || !Array.isArray(rows)) continue;

      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => "?").join(", ");
      const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = columns.map(col => row[col]);
        await db.runAsync(query, values);
      }
    }
  });

  return true;
};
