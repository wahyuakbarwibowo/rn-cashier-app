import { getDB } from "./initDB";
import { ShopProfile } from "../types/database"; 

export const getShopProfile = async (): Promise<ShopProfile | null> => {
  const db = await getDB();
  return await db.getFirstAsync<ShopProfile>(
    "SELECT id, name, footer_note, cashier_name, phone_number, address, poin_enabled FROM shop_profile LIMIT 1"
  );
};

export const updateShopProfile = async (profile: Partial<ShopProfile>): Promise<void> => {
  const db = await getDB();
  const existing = await getShopProfile();
  
  if (existing) {
    const updatedProfile = { ...existing, ...profile };
    await db.runAsync(
      "UPDATE shop_profile SET name = ?, footer_note = ?, cashier_name = ?, phone_number = ?, address = ?, poin_enabled = ? WHERE id = ?",
      [
        updatedProfile.name ?? "", 
        updatedProfile.footer_note ?? "", 
        updatedProfile.cashier_name ?? "",
        updatedProfile.phone_number ?? "",
        updatedProfile.address ?? "",
        updatedProfile.poin_enabled ?? 1,
        existing.id!
      ]
    );
  } else {
    await db.runAsync(
      "INSERT INTO shop_profile (name, footer_note, cashier_name, phone_number, address, poin_enabled) VALUES (?, ?, ?, ?, ?, ?)",
      [
        profile.name ?? "", 
        profile.footer_note ?? "", 
        profile.cashier_name ?? "",
        profile.phone_number ?? "",
        profile.address ?? "",
        profile.poin_enabled ?? 1
      ]
    );
  }
};

