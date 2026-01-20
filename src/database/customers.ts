import { getDB } from "./initDB";
import { Customer } from "../types/database";

export const getCustomers = async (): Promise<Customer[]> => {
  const db = await getDB();
  return await db.getAllAsync<Customer>("SELECT * FROM customers ORDER BY name ASC");
};

export const addCustomer = async (customer: Omit<Customer, "id">): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    "INSERT INTO customers (name, phone, address, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
    [customer.name, customer.phone ?? "", customer.address ?? ""]
  );
};

export const updateCustomer = async (id: number, customer: Omit<Customer, "id">): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    "UPDATE customers SET name = ?, phone = ?, address = ?, updated_at = datetime('now') WHERE id = ?",
    [customer.name, customer.phone ?? "", customer.address ?? "", id]
  );
};

export const deleteCustomer = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
};
