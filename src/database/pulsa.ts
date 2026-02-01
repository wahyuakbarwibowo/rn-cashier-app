import { getDB } from "./initDB";

export interface DigitalTransaction {
  id?: number;
  category: "PULSA" | "PLN" | "PDAM" | "TRANSFER" | "BPJS" | "E-WALLET" | "GAME";
  phone_number: string;
  customer_name?: string;
  provider: string; // Could be Bank Name, Game Name, etc.
  amount: number;
  cost_price: number;
  selling_price: number;
  profit: number;
  notes?: string;
  created_at?: string;
}

export const getDigitalTransactions = async (): Promise<DigitalTransaction[]> => {
  const db = await getDB();
  return await db.getAllAsync<DigitalTransaction>("SELECT * FROM phone_history ORDER BY id DESC");
};

export const addDigitalTransaction = async (trx: Omit<DigitalTransaction, "id" | "created_at">): Promise<number> => {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO phone_history (category, phone_number, customer_name, provider, amount, cost_price, selling_price, profit, notes, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      trx.category,
      trx.phone_number,
      trx.customer_name || null,
      trx.provider,
      trx.amount,
      trx.cost_price,
      trx.selling_price,
      trx.profit,
      trx.notes || null
    ]
  );
  return result.lastInsertRowId;
};

// Keep old names for compatibility during migration
export type PhoneHistory = DigitalTransaction;
export const addPhoneHistory = (history: any) => addDigitalTransaction({ ...history, category: 'PULSA' });
export const getPhoneHistory = getDigitalTransactions;

export const getRecentNumbers = async (): Promise<{phone_number: string, customer_name: string}[]> => {
  const db = await getDB();
  return await db.getAllAsync<{phone_number: string, customer_name: string}>(
    "SELECT DISTINCT phone_number, customer_name FROM phone_history ORDER BY created_at DESC LIMIT 50"
  );
};

export const getDigitalReports = async (startDate: string, endDate: string) => {
  const db = await getDB();
  const summary = await db.getFirstAsync<{total_sales: number, total_profit: number}>(
    "SELECT SUM(selling_price) as total_sales, SUM(profit) as total_profit FROM phone_history WHERE date(created_at) BETWEEN ? AND ?",
    [startDate, endDate]
  );
  
  const byCategory = await db.getAllAsync<{category: string, total_sales: number, total_profit: number, count: number}>(
    "SELECT category, SUM(selling_price) as total_sales, SUM(profit) as total_profit, COUNT(*) as count FROM phone_history WHERE date(created_at) BETWEEN ? AND ? GROUP BY category",
    [startDate, endDate]
  );

  return { summary, byCategory };
};

export const getDistinctPhoneNumbers = getRecentNumbers;
