import { getDB } from "./initDB";

export interface Expense {
  id?: number;
  category: string;
  amount: number;
  notes?: string;
  created_at?: string;
}

export const getExpenses = async (): Promise<Expense[]> => {
  const db = await getDB();
  return await db.getAllAsync<Expense>("SELECT * FROM expenses ORDER BY created_at DESC");
};

export const addExpense = async (expense: Omit<Expense, "id">): Promise<number> => {
  const db = await getDB();
  const result = await db.runAsync(
    "INSERT INTO expenses (category, amount, notes, created_at) VALUES (?, ?, ?, datetime('now', 'localtime'))",
    [expense.category, expense.amount, expense.notes ?? ""]
  );
  return result.lastInsertRowId;
};

export const deleteExpense = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
};

export const getDailyExpenses = async (date: string): Promise<Expense[]> => {
  const db = await getDB();
  return await db.getAllAsync<Expense>(
    "SELECT * FROM expenses WHERE date(created_at) = date(?) ORDER BY created_at DESC", 
    [date]
  );
};
