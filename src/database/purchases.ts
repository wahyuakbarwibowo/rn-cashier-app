import { getDB } from "./initDB";
import { Purchase, PurchaseItem } from "../types/purchase";

// CREATE Purchase
export async function addPurchase(
  purchase: Omit<Purchase, "id"> & { isDebt?: boolean; dueDate?: string },
  items: Omit<PurchaseItem, "id" | "purchaseId">[]
): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    "INSERT INTO purchases (created_at, supplier, supplier_id, total) VALUES (?, ?, ?, ?)",
    [purchase.date, purchase.supplier || null, purchase.supplier_id || null, purchase.total]
  );

  const purchaseId = result.lastInsertRowId as number;

  for (const item of items) {
    // insert detail item
    await db.runAsync(
      "INSERT INTO purchase_items (purchase_id, product_id, qty, price) VALUES (?, ?, ?, ?)",
      [purchaseId, item.productId, item.qty, item.price]
    );

    // update stok produk
    await db.runAsync(
      "UPDATE products SET stock = stock + ? WHERE id = ?",
      [item.qty, item.productId]
    );
  }

  // Create payable if it's a debt
  if (purchase.isDebt) {
    await db.runAsync(
      "INSERT INTO payables (purchase_id, supplier_id, supplier, amount, due_date, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [purchaseId, purchase.supplier_id || null, purchase.supplier || null, purchase.total, purchase.dueDate || null]
    );
  }

  return purchaseId;
}

// READ all purchases
export async function getAllPurchases() {
  const db = await getDB();
  return await db.getAllAsync<Purchase>(
    "SELECT * FROM purchases ORDER BY id DESC"
  );
}

// READ purchase detail items
export async function getPurchaseItems(purchaseId: number) {
  const db = await getDB();
  return await db.getAllAsync<PurchaseItem>(
    "SELECT * FROM purchase_items WHERE purchase_id = ?",
    [purchaseId]
  );
}
