import { getDB } from "./initDB";
import { Customer } from "../types/database";

export const getCustomers = async (): Promise<Customer[]> => {
  const db = await getDB();
  return await db.getAllAsync<Customer>("SELECT * FROM customers ORDER BY name ASC");
};

export const addCustomer = async (customer: Omit<Customer, "id">): Promise<number> => {
  const db = await getDB();
  const result = await db.runAsync(
    "INSERT INTO customers (name, phone, address, points, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
    [customer.name, customer.phone ?? "", customer.address ?? "", customer.points ?? 0]
  );
  return result.lastInsertRowId;
};

export const updateCustomer = async (id: number, customer: Omit<Customer, "id">): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    "UPDATE customers SET name = ?, phone = ?, address = ?, points = ?, updated_at = datetime('now') WHERE id = ?",
    [customer.name, customer.phone ?? "", customer.address ?? "", customer.points ?? 0, id]
  );
};

export const adjustCustomerPoints = async (id: number, points: number, type: 'EARNED' | 'REDEEMED' | 'ADJUSTMENT', saleId?: number, notes?: string): Promise<void> => {
  const db = await getDB();
  // Update customer total points
  await db.runAsync(
    "UPDATE customers SET points = points + ?, updated_at = datetime('now') WHERE id = ?",
    [points, id]
  );
  // Log history
  await db.runAsync(
    "INSERT INTO customer_points_history (customer_id, sale_id, points, type, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    [id, saleId ?? null, points, type, notes ?? ""]
  );
};

export const deleteCustomer = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
};
