import { getDB } from "./initDB";

export interface DigitalTransaction {
  id?: number;
  category: string;
  phone_number: string;
  customer_name?: string;
  provider: string; // Could be Bank Name, Game Name, etc.
  amount: number;
  cost_price: number;
  selling_price: number;
  paid: number; // Jumlah yang dibayar pelanggan
  profit: number;
  notes?: string;
  created_at?: string;
}

export const getDigitalTransactions = async (startDate?: string, endDate?: string, category?: string): Promise<DigitalTransaction[]> => {
  const db = await getDB();
  let query = "SELECT * FROM phone_history";
  let params: any[] = [];
  let conditions: string[] = [];

  if (startDate && endDate) {
    conditions.push("date(created_at) BETWEEN ? AND ?");
    params.push(startDate, endDate);
  }

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY id DESC";
  return await db.getAllAsync<DigitalTransaction>(query, params);
};

export const addDigitalTransaction = async (trx: Omit<DigitalTransaction, "id">): Promise<number> => {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO phone_history (category, phone_number, customer_name, provider, amount, cost_price, selling_price, paid, profit, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trx.category,
      trx.phone_number,
      trx.customer_name || null,
      trx.provider,
      trx.amount,
      trx.cost_price,
      trx.selling_price,
      trx.paid || trx.selling_price,
      trx.profit,
      trx.notes || null,
      trx.created_at || new Date().toISOString()
    ]
  );
  return result.lastInsertRowId;
};

export const updateDigitalTransaction = async (id: number, trx: Partial<DigitalTransaction>): Promise<void> => {
  const db = await getDB();
  const sets: string[] = [];
  const params: any[] = [];

  if (trx.category) { sets.push("category = ?"); params.push(trx.category); }
  if (trx.phone_number) { sets.push("phone_number = ?"); params.push(trx.phone_number); }
  if (trx.customer_name !== undefined) { sets.push("customer_name = ?"); params.push(trx.customer_name); }
  if (trx.provider) { sets.push("provider = ?"); params.push(trx.provider); }
  if (trx.amount !== undefined) { sets.push("amount = ?"); params.push(trx.amount); }
  if (trx.cost_price !== undefined) { sets.push("cost_price = ?"); params.push(trx.cost_price); }
  if (trx.selling_price !== undefined) { sets.push("selling_price = ?"); params.push(trx.selling_price); }
  if (trx.paid !== undefined) { sets.push("paid = ?"); params.push(trx.paid); }
  if (trx.profit !== undefined) { sets.push("profit = ?"); params.push(trx.profit); }
  if (trx.notes !== undefined && trx.notes !== null) { sets.push("notes = ?"); params.push(trx.notes); }
  if (trx.created_at) { sets.push("created_at = ?"); params.push(trx.created_at); }

  if (sets.length === 0) {
    console.warn("updateDigitalTransaction: No fields to update for id", id);
    return;
  }

  params.push(id);
  await db.runAsync(
    `UPDATE phone_history SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
};

// Keep old names for compatibility during migration
export type PhoneHistory = DigitalTransaction;
export const addPhoneHistory = (history: any) => addDigitalTransaction({ ...history, category: 'PULSA' });
export const getPhoneHistory = getDigitalTransactions;

export const getRecentNumbers = async (): Promise<{ phone_number: string, customer_name: string }[]> => {
  const db = await getDB();
  return await db.getAllAsync<{ phone_number: string, customer_name: string }>(
    "SELECT DISTINCT phone_number, customer_name FROM phone_history ORDER BY created_at DESC LIMIT 50"
  );
};

export const getDigitalReports = async (startDate: string, endDate: string) => {
  const db = await getDB();
  const summary = await db.getFirstAsync<{ total_sales: number, total_profit: number }>(
    "SELECT SUM(selling_price) as total_sales, SUM(profit) as total_profit FROM phone_history WHERE date(created_at) BETWEEN ? AND ?",
    [startDate, endDate]
  );

  const byCategory = await db.getAllAsync<{ category: string, total_sales: number, total_profit: number, count: number }>(
    "SELECT category, SUM(selling_price) as total_sales, SUM(profit) as total_profit, COUNT(*) as count FROM phone_history WHERE date(created_at) BETWEEN ? AND ? GROUP BY category",
    [startDate, endDate]
  );

  return { summary, byCategory };
};

export const getDistinctPhoneNumbers = getRecentNumbers;
