import { getDB } from "./initDB";
import { ShopProfile } from "../types/database";

export const getShopProfile = async (): Promise<ShopProfile | null> => {
  const db = await getDB();
  return await db.getFirstAsync<ShopProfile>("SELECT * FROM shop_profile LIMIT 1");
};

export const updateShopProfile = async (profile: ShopProfile): Promise<void> => {
  const db = await getDB();
  const existing = await getShopProfile();
  
  if (existing) {
    await db.runAsync(
      "UPDATE shop_profile SET name = ?, footer_note = ?, cashier_name = ? WHERE id = ?",
      [profile.name ?? "", profile.footer_note ?? "", profile.cashier_name ?? "", existing.id!]
    );
  } else {
    await db.runAsync(
      "INSERT INTO shop_profile (name, footer_note, cashier_name) VALUES (?, ?, ?)",
      [profile.name ?? "", profile.footer_note ?? "", profile.cashier_name ?? ""]
    );
  }

};
