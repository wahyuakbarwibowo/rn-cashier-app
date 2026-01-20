import { getDB } from "./initDB";

export interface PhoneHistory {
  id?: number;
  phone_number: string;
  provider: string;
  amount: number;
  cost_price: number;
  selling_price: number;
  profit: number;
  created_at: string;
}

export const getPhoneHistory = async (): Promise<PhoneHistory[]> => {
  const db = await getDB();
  return await db.getAllAsync<PhoneHistory>("SELECT * FROM phone_history ORDER BY id DESC");
};

export const addPhoneHistory = async (history: Omit<PhoneHistory, "id" | "created_at">): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO phone_history (phone_number, provider, amount, cost_price, selling_price, profit, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      history.phone_number,
      history.provider,
      history.amount,
      history.cost_price,
      history.selling_price,
      history.profit
    ]
  );
};

export const getDistinctPhoneNumbers = async (): Promise<{phone_number: string}[]> => {
  const db = await getDB();
  return await db.getAllAsync<{phone_number: string}>("SELECT DISTINCT phone_number FROM phone_history ORDER BY created_at DESC LIMIT 50");
};
