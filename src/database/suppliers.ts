import { getDB } from "./initDB";
import { Supplier } from "../types/supplier";

export const getSuppliers = async (): Promise<Supplier[]> => {
  const db = await getDB();
  return await db.getAllAsync<Supplier>("SELECT * FROM suppliers ORDER BY name ASC");
};

export const addSupplier = async (supplier: Omit<Supplier, "id">): Promise<number> => {
  const db = await getDB();
  const result = await db.runAsync(
    "INSERT INTO suppliers (name, phone, address, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
    [supplier.name, supplier.phone ?? "", supplier.address ?? ""]
  );
  return result.lastInsertRowId;
};

export const updateSupplier = async (id: number, supplier: Omit<Supplier, "id">): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    "UPDATE suppliers SET name = ?, phone = ?, address = ?, updated_at = datetime('now') WHERE id = ?",
    [supplier.name, supplier.phone ?? "", supplier.address ?? "", id]
  );
};

export const deleteSupplier = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync("DELETE FROM suppliers WHERE id = ?", [id]);
};
