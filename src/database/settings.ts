import { getDB } from "./initDB";
// Assuming ShopProfile type in ../types/database includes phone_number and address
// For example:
// export interface ShopProfile {
//   id?: number;
//   name?: string;
//   footer_note?: string;
//   cashier_name?: string;
//   phone_number?: string; // Added
//   address?: string;      // Added
// }
import { ShopProfile } from "../types/database"; 

export const getShopProfile = async (): Promise<ShopProfile | null> => {
  const db = await getDB();
  // Ensure the SELECT query includes the new columns if they are expected
  // If initDB.ts is not updated, these might be undefined here.
  return await db.getFirstAsync<ShopProfile>(
    "SELECT id, name, footer_note, cashier_name, phone_number, address FROM shop_profile LIMIT 1"
  );
};

export const updateShopProfile = async (profile: ShopProfile): Promise<void> => {
  const db = await getDB();
  const existing = await getShopProfile();
  
  if (existing) {
    await db.runAsync(
      "UPDATE shop_profile SET name = ?, footer_note = ?, cashier_name = ?, phone_number = ?, address = ? WHERE id = ?",
      [
        profile.name ?? "", 
        profile.footer_note ?? "", 
        profile.cashier_name ?? "",
        profile.phone_number ?? "", // Include phone number
        profile.address ?? "",     // Include address
        existing.id!
      ]
    );
  } else {
    await db.runAsync(
      "INSERT INTO shop_profile (name, footer_note, cashier_name, phone_number, address) VALUES (?, ?, ?, ?, ?)",
      [
        profile.name ?? "", 
        profile.footer_note ?? "", 
        profile.cashier_name ?? "",
        profile.phone_number ?? "", // Include phone number
        profile.address ?? ""      // Include address
      ]
    );
  }
};
