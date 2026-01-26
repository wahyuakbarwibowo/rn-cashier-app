import { getDB } from "./initDB";
import { PaymentMethod } from "../types/database";

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const db = await getDB();
  const methods = await db.getAllAsync<PaymentMethod>("SELECT * FROM payment_methods");
  
  if (methods.length === 0) {
    // Initial data
    const defaults = ["Tunai", "Hutang", "Kartu Debit", "E-Wallet", "QRIS"];
    for (const name of defaults) {
      await db.runAsync("INSERT INTO payment_methods (name) VALUES (?)", [name]);
    }
    return await db.getAllAsync<PaymentMethod>("SELECT * FROM payment_methods");
  }
  
  if (methods.length > 0) {
    const hasHutang = methods.some(m => m.name.toLowerCase() === "hutang");
    if (!hasHutang) {
      await db.runAsync("INSERT INTO payment_methods (name) VALUES (?)", ["Hutang"]);
      return await db.getAllAsync<PaymentMethod>("SELECT * FROM payment_methods");
    }
  }

  return methods;
};

export const addPaymentMethod = async (name: string): Promise<void> => {
  const db = await getDB();
  await db.runAsync("INSERT INTO payment_methods (name) VALUES (?)", [name]);
};

export const deletePaymentMethod = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync("DELETE FROM payment_methods WHERE id = ?", [id]);
};
