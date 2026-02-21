import * as SQLite from "expo-sqlite";
import { getDB } from "./initDB";
import { Sale, SaleItem } from "../types/database";

export async function addSale(
  sale: Omit<Sale, "id">,
  items: { product_id: number; qty: number; price: number; subtotal: number }[]
): Promise<number> {
  const db = await getDB();
  const createdAt = sale.created_at || new Date().toISOString();

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

export async function getAllSales(startDate?: string, endDate?: string, limit?: number, offset?: number) {
  const db = await getDB();
  const pageSize = limit || 20;
  const pageOffset = offset || 0;

  if (startDate && endDate) {
    return await db.getAllAsync<Sale>(
      "SELECT * FROM sales WHERE date(created_at) BETWEEN ? AND ? ORDER BY id DESC LIMIT ? OFFSET ?",
      [startDate, endDate, pageSize, pageOffset]
    );
  }
  return await db.getAllAsync<Sale>(
    "SELECT * FROM sales ORDER BY id DESC LIMIT ? OFFSET ?",
    [pageSize, pageOffset]
  );
}

export async function getSaleItems(saleId: number) {
  const db = await getDB();
  return await db.getAllAsync<SaleItem>(
    "SELECT * FROM sales_items WHERE sale_id = ?",
    [saleId]
  );
}

export type SaleItemPayload = {
  product_id: number;
  qty: number;
  price: number;
  subtotal: number;
};

export interface SaleDetail {
  sale: Sale;
  items: SaleItem[];
}

export async function getSaleDetail(saleId: number): Promise<SaleDetail | null> {
  const db = await getDB();
  const sale = await db.getFirstAsync<Sale>(
    "SELECT * FROM sales WHERE id = ?",
    [saleId]
  );
  if (!sale) return null;
  const items = await getSaleItems(saleId);
  return { sale, items };
}

const revertCustomerPoints = async (
  db: SQLite.SQLiteDatabase,
  customerId: number,
  pointsEarned: number | undefined,
  pointsRedeemed: number | undefined,
  saleId: number
) => {
  if (pointsEarned && pointsEarned > 0) {
    await db.runAsync(
      "UPDATE customers SET points = points - ?, updated_at = datetime('now') WHERE id = ?",
      [pointsEarned, customerId]
    );
    await db.runAsync(
      "DELETE FROM customer_points_history WHERE sale_id = ? AND type = 'EARNED'",
      [saleId]
    );
  }
  if (pointsRedeemed && pointsRedeemed > 0) {
    await db.runAsync(
      "UPDATE customers SET points = points + ?, updated_at = datetime('now') WHERE id = ?",
      [pointsRedeemed, customerId]
    );
    await db.runAsync(
      "DELETE FROM customer_points_history WHERE sale_id = ? AND type = 'REDEEMED'",
      [saleId]
    );
  }
};

const applyCustomerPoints = async (
  db: SQLite.SQLiteDatabase,
  customerId: number,
  pointsEarned: number,
  pointsRedeemed: number,
  saleId: number,
  createdAt: string
) => {
  if (pointsEarned && pointsEarned > 0) {
    await db.runAsync(
      "UPDATE customers SET points = points + ?, updated_at = datetime('now') WHERE id = ?",
      [pointsEarned, customerId]
    );
    await db.runAsync(
      "INSERT INTO customer_points_history (customer_id, sale_id, points, type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [customerId, saleId, pointsEarned, 'EARNED', 'Poin dari belanja', createdAt]
    );
  }
  if (pointsRedeemed && pointsRedeemed > 0) {
    await db.runAsync(
      "UPDATE customers SET points = points - ?, updated_at = datetime('now') WHERE id = ?",
      [pointsRedeemed, customerId]
    );
    await db.runAsync(
      "INSERT INTO customer_points_history (customer_id, sale_id, points, type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [customerId, saleId, -pointsRedeemed, 'REDEEMED', 'Penukaran poin', createdAt]
    );
  }
};

export async function updateSale(
  saleId: number,
  sale: Sale,
  items: SaleItemPayload[]
) {
  const db = await getDB();
  const existingSale = await db.getFirstAsync<Sale>(
    "SELECT * FROM sales WHERE id = ?",
    [saleId]
  );
  if (!existingSale) {
    throw new Error("Sale not found");
  }

  const existingItems = await getSaleItems(saleId);

  const createdAt = sale.created_at || new Date().toISOString();

  await db.execAsync("BEGIN TRANSACTION");
  try {
    for (const item of existingItems) {
      await db.runAsync(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.qty, item.product_id]
      );
    }

    if (existingSale.customer_id) {
      await revertCustomerPoints(
        db,
        existingSale.customer_id,
        existingSale.points_earned,
        existingSale.points_redeemed,
        saleId
      );
    }

    await db.runAsync("DELETE FROM receivables WHERE sale_id = ?", [saleId]);

    await db.runAsync(
      `UPDATE sales SET
        customer_id = ?,
        payment_method_id = ?,
        total = ?,
        paid = ?,
        change = ?,
        points_earned = ?,
        points_redeemed = ?,
        created_at = ?
      WHERE id = ?`,
      [
        sale.customer_id || null,
        sale.payment_method_id || null,
        sale.total,
        sale.paid,
        sale.change,
        sale.points_earned || 0,
        sale.points_redeemed || 0,
        createdAt,
        saleId
      ]
    );

    await db.runAsync("DELETE FROM sales_items WHERE sale_id = ?", [saleId]);

    for (const item of items) {
      await db.runAsync(
        "INSERT INTO sales_items (sale_id, product_id, qty, price, subtotal) VALUES (?, ?, ?, ?, ?)",
        [saleId, item.product_id, item.qty, item.price, item.subtotal]
      );
      await db.runAsync(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.qty, item.product_id]
      );
    }

    if (sale.paid < sale.total && sale.customer_id) {
      await db.runAsync(
        "INSERT INTO receivables (sale_id, customer_id, amount, due_date, status) VALUES (?, ?, ?, ?, ?)",
        [saleId, sale.customer_id, sale.total - sale.paid, createdAt, 'pending']
      );
    }

    if (sale.customer_id) {
      await applyCustomerPoints(
        db,
        sale.customer_id,
        sale.points_earned || 0,
        sale.points_redeemed || 0,
        saleId,
        createdAt
      );
    }

    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}
