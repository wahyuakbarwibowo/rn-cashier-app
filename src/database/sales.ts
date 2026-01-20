import * as SQLite from "expo-sqlite";
import { Sale, SaleItem } from "../types/database";

const db = SQLite.openDatabaseSync("kasir.db");

export async function addSale(
  sale: Omit<Sale, "id">,
  items: { product_id: number; qty: number; price: number; subtotal: number }[]
): Promise<number> {
  const createdAt = new Date().toISOString();
  
  const result = await db.runAsync(
    "INSERT INTO sales (customer_id, payment_method_id, total, paid, change, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [
      sale.customer_id || null,
      sale.payment_method_id || null,
      sale.total,
      sale.paid,
      sale.change,
      createdAt,
    ]
  );

  const saleId = result.lastInsertRowId as number;

  for (const item of items) {
    // Insert sale item
    await db.runAsync(
      "INSERT INTO sales_items (sale_id, product_id, qty, price, subtotal) VALUES (?, ?, ?, ?, ?)",
      [saleId, item.product_id, item.qty, item.price, item.subtotal]
    );

    // Update product stock (decrease)
    await db.runAsync(
      "UPDATE products SET stock = stock - ? WHERE id = ?",
      [item.qty, item.product_id]
    );
  }

  return saleId;
}

export async function getAllSales() {
  return await db.getAllAsync<Sale>(
    "SELECT * FROM sales ORDER BY id DESC"
  );
}

export async function getSaleItems(saleId: number) {
  return await db.getAllAsync<SaleItem>(
    "SELECT * FROM sales_items WHERE sale_id = ?",
    [saleId]
  );
}
