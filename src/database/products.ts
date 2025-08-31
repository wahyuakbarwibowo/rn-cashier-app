import * as SQLite from "expo-sqlite";
import { Product } from "../types/product";

const db = SQLite.openDatabaseSync("kasir.db");

// CREATE
export async function addProduct(product: Product): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO products 
      (code, name, purchase_price, purchase_unit, purchase_package_qty, 
       sale_price, sale_unit, sale_package_qty, discount, stock, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.code,
      product.name,
      product.purchasePrice,
      product.purchaseUnit || null,
      product.purchasePackageQty || null,
      product.salePrice,
      product.saleUnit || null,
      product.salePackageQty || null,
      product.discount || 0,
      product.stock || 0,
      now,
      now,
    ]
  );
  return result.lastInsertRowId as number;
}

// READ (all)
export async function getAllProducts(): Promise<Product[]> {
  const result = await db.getAllAsync<Product>(
    "SELECT * FROM products ORDER BY id DESC"
  );
  return result;
}

// READ (by id)
export async function getProductById(id: number): Promise<Product | null> {
  const result = await db.getFirstAsync<Product>(
    "SELECT * FROM products WHERE id = ?",
    [id]
  );
  return result || null;
}

// UPDATE
export async function updateProduct(id: number, product: Product): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE products 
     SET code = ?, name = ?, purchase_price = ?, purchase_unit = ?, purchase_package_qty = ?, 
         sale_price = ?, sale_unit = ?, sale_package_qty = ?, discount = ?, stock = ?, updated_at = ?
     WHERE id = ?`,
    [
      product.code,
      product.name,
      product.purchasePrice,
      product.purchaseUnit || null,
      product.purchasePackageQty || null,
      product.salePrice,
      product.saleUnit || null,
      product.salePackageQty || null,
      product.discount || 0,
      product.stock || 0,
      now,
      id,
    ]
  );
}

// DELETE
export async function deleteProduct(id: number): Promise<void> {
  await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
}

