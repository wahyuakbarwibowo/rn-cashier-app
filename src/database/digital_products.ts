import { getDB } from "./initDB";

export interface DigitalProductMaster {
  id?: number;
  category: string;
  provider: string;
  name: string;
  nominal: number;
  cost_price: number;
  selling_price: number;
  created_at?: string;
}

export const getDigitalProducts = async (category?: string, provider?: string): Promise<DigitalProductMaster[]> => {
  const db = await getDB();
  let query = "SELECT * FROM digital_products";
  const params: any[] = [];

  if (category && provider) {
    query += " WHERE category = ? AND provider = ?";
    params.push(category, provider);
  } else if (category) {
    query += " WHERE category = ?";
    params.push(category);
  }

  query += " ORDER BY category ASC, provider ASC, nominal ASC";
  return await db.getAllAsync<DigitalProductMaster>(query, params);
};

export const addDigitalProduct = async (product: Omit<DigitalProductMaster, "id" | "created_at">): Promise<number> => {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO digital_products (category, provider, name, nominal, cost_price, selling_price, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [product.category, product.provider, product.name, product.nominal, product.cost_price, product.selling_price]
  );
  return result.lastInsertRowId;
};

export const updateDigitalProduct = async (id: number, product: Partial<DigitalProductMaster>): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    `UPDATE digital_products SET 
     category = COALESCE(?, category), 
     provider = COALESCE(?, provider), 
     name = COALESCE(?, name), 
     nominal = COALESCE(?, nominal), 
     cost_price = COALESCE(?, cost_price), 
     selling_price = COALESCE(?, selling_price)
     WHERE id = ?`,
    [
      product.category ?? null, 
      product.provider ?? null, 
      product.name ?? null, 
      product.nominal ?? null, 
      product.cost_price ?? null, 
      product.selling_price ?? null, 
      id
    ]
  );
};

export const deleteDigitalProduct = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync("DELETE FROM digital_products WHERE id = ?", [id]);
};

export const getDistinctProvidersByCategory = async (category: string): Promise<{provider: string}[]> => {
  const db = await getDB();
  return await db.getAllAsync<{provider: string}>(
    "SELECT DISTINCT provider FROM digital_products WHERE category = ? ORDER BY provider ASC",
    [category]
  );
};
