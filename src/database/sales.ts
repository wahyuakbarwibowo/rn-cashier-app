import { getDB } from "./initDB";
import { Sale, SaleItem } from "../types/database";

export async function addSale(
  sale: Omit<Sale, "id">,
  items: { product_id: number; qty: number; price: number; subtotal: number }[]
): Promise<number> {
  const db = await getDB();
  const createdAt = new Date().toISOString();

  const result = await db.runAsync(
    "INSERT INTO sales (customer_id, payment_method_id, total, paid, change, points_earned, points_redeemed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      sale.customer_id || null,
      sale.payment_method_id || null,
      sale.total,
      sale.paid,
      sale.change,
      sale.points_earned || 0,
      sale.points_redeemed || 0,
      createdAt,
    ]
  );

  const saleId = result.lastInsertRowId as number;

  // Adjust customer points if applicable
  if (sale.customer_id) {
    if (sale.points_earned && sale.points_earned > 0) {
      await db.runAsync(
        "UPDATE customers SET points = points + ?, updated_at = datetime('now') WHERE id = ?",
        [sale.points_earned, sale.customer_id]
      );
      await db.runAsync(
        "INSERT INTO customer_points_history (customer_id, sale_id, points, type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [sale.customer_id, saleId, sale.points_earned, 'EARNED', 'Poin dari belanja', createdAt]
      );
    }
    if (sale.points_redeemed && sale.points_redeemed > 0) {
      await db.runAsync(
        "UPDATE customers SET points = points - ?, updated_at = datetime('now') WHERE id = ?",
        [sale.points_redeemed, sale.customer_id]
      );
      await db.runAsync(
        "INSERT INTO customer_points_history (customer_id, sale_id, points, type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [sale.customer_id, saleId, -sale.points_redeemed, 'REDEEMED', 'Penukaran poin', createdAt]
      );
    }
  }

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

  // Create receivable if payment is less than total
  if (sale.paid < sale.total && sale.customer_id) {
    await db.runAsync(
      "INSERT INTO receivables (sale_id, customer_id, amount, due_date, status) VALUES (?, ?, ?, ?, ?)",
      [saleId, sale.customer_id, sale.total - sale.paid, createdAt, 'pending']
    );
  }

  return saleId;
}

export async function getAllSales(startDate?: string, endDate?: string) {
  const db = await getDB();
  if (startDate && endDate) {
    return await db.getAllAsync<Sale>(
      "SELECT * FROM sales WHERE date(created_at) BETWEEN ? AND ? ORDER BY id DESC",
      [startDate, endDate]
    );
  }
  return await db.getAllAsync<Sale>(
    "SELECT * FROM sales ORDER BY id DESC"
  );
}

export async function getSaleItems(saleId: number) {
  const db = await getDB();
  return await db.getAllAsync<SaleItem>(
    "SELECT * FROM sales_items WHERE sale_id = ?",
    [saleId]
  );
}
