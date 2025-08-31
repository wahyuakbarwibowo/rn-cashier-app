import { getDB } from "./initDB";
import { Product } from "../types/database";

// Tambah produk
export const addProduct = async (product: Product): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO products (code, name, purchase_price, selling_price, stock, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      product.code ?? null,
      product.name,
      product.purchase_price ?? 0,
      product.selling_price ?? 0,
      product.stock ?? 0,
    ]
  );
};

// Ambil semua produk
export const getProducts = async (): Promise<Product[]> => {
  const db = await getDB();
  const result = await db.getAllAsync<Product>("SELECT * FROM products ORDER BY id DESC");
  return result;
};

// Update produk
export const updateProduct = async (id: number, product: Product): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    `UPDATE products 
     SET code = ?, name = ?, purchase_price = ?, selling_price = ?, stock = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      product.code ?? null,
      product.name,
      product.purchase_price ?? 0,
      product.selling_price ?? 0,
      product.stock ?? 0,
      id,
    ]
  );
};

// Hapus produk
export const deleteProduct = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
};
