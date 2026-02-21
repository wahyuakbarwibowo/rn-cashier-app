import * as Print from "expo-print";
import { DigitalTransaction } from "../database/pulsa";
import { getShopProfile } from "../database/settings";
import { Sale, ShopProfile } from "../types/database";

// ============================================
// RawBT Command Types
// ============================================
type RawBTCommand =
  | { type: "text"; text: string; align?: "left" | "center" | "right"; bold?: boolean; size?: "normal" | "double" | "double-height" | "double-width"; newline?: boolean }
  | { type: "qr"; text: string; align?: "left" | "center" | "right"; newline?: boolean }
  | { type: "barcode"; text: string; align?: "left" | "center" | "right"; newline?: boolean }
  | { type: "cut" }
  | { type: "feed"; lines?: number };

// ============================================
// RawBT HTTP Client
// ============================================
const RAWBT_HOST = "127.0.0.1";
const RAWBT_PORT = "8080";
const RAWBT_URL = `http://${RAWBT_HOST}:${RAWBT_PORT}/print`;
const RAWBT_TIMEOUT = 5000;

const sendToRawBT = async (commands: RawBTCommand[]): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RAWBT_TIMEOUT);

    const response = await fetch(RAWBT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseText = await response.text();

    if (!response.ok) {
      console.error("[RawBT] HTTP error:", response.status, responseText);
      throw new Error(`RawBT HTTP error: ${response.status} - ${responseText}`);
    }

    console.log("[RawBT] Printed successfully");
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (!errorMsg.includes('Aborted')) { // Don't warn on user-intended abort
      console.error("[RawBT] Error:", errorMsg);
      console.warn("[RawBT] Fallback to expo-print");
    }
    return false;
  }
};

// ============================================
// Utility Functions
// ============================================
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const formatCurrency = (amount: number) => {
  return amount.toLocaleString("id-ID");
};

const padRight = (str: string, length: number) => {
  return str.padEnd(length, " ");
};

const padLeft = (str: string, length: number) => {
  return str.padStart(length, " ");
};

const LINE_WIDTH = 32; // Standard for 58mm thermal printers
const DIVIDER = "-".repeat(LINE_WIDTH);

// ============================================
// RawBT Command Builders
// ============================================

const buildSaleReceiptCommands = (
  sale: Sale & { payment_method_name?: string },
  items: any[],
  profile: ShopProfile
): RawBTCommand[] => {
  const commands: RawBTCommand[] = [];

  // === HEADER ===
  commands.push({ type: "text", text: profile.name.toUpperCase() || "TOKO", align: "center", bold: true, size: "double-width", newline: true });
  if (profile.address) commands.push({ type: "text", text: profile.address, align: "center", newline: true });
  if (profile.phone_number) commands.push({ type: "text", text: `Telp: ${profile.phone_number}`, align: "center", newline: true });
  // Removed commands.push({ type: "feed", lines: 1 });
  
  const trxLine = `No: ${sale.id} Kasir: ${profile.cashier_name || 'Admin'}`;
  commands.push({ type: "text", text: trxLine, align: "left", newline: true });
  commands.push({ type: "text", text: formatDate(sale.created_at), align: "left", newline: true });
  commands.push({ type: "text", text: DIVIDER, align: "center", newline: true });

  // === ITEMS ===
  items.forEach((item) => {
    commands.push({ type: "text", text: item.product_name || "Produk", align: "left", bold: true, newline: true });
    const qtyPrice = `${item.qty} x ${formatCurrency(item.price)}`;
    const subtotal = formatCurrency(item.subtotal);
    const itemLine = `${padRight(qtyPrice, LINE_WIDTH - subtotal.length)}${subtotal}`;
    commands.push({ type: "text", text: itemLine, align: "left", newline: true });
  });

  commands.push({ type: "text", text: DIVIDER, align: "center", newline: true });

  // === PAYMENT & TOTALS ===
  const totalStr = formatCurrency(sale.total);
  const paidStr = formatCurrency(sale.paid);
  const changeStr = formatCurrency(sale.change);
  const paymentMethodStr = sale.payment_method_name || "-";

  commands.push({ type: "text", text: `${padRight("Total", LINE_WIDTH - totalStr.length)}${totalStr}`, newline: true });
  commands.push({ type: "text", text: `${padRight("Bayar", LINE_WIDTH - paidStr.length)}${paidStr}`, newline: true });
  commands.push({ type: "text", text: `${padRight("Kembali", LINE_WIDTH - changeStr.length)}${changeStr}`, newline: true });
  commands.push({ type: "text", text: `${padRight("Metode", LINE_WIDTH - paymentMethodStr.length)}${paymentMethodStr}`, newline: true, });

  // === POINTS (if enabled and applicable) ===
  if (profile.poin_enabled !== 0) {
    if ((sale.points_earned && sale.points_earned > 0) || (sale.points_redeemed && sale.points_redeemed > 0)) {
      commands.push({ type: "text", text: DIVIDER, align: "center", newline: true });
    }
    if (sale.points_earned && sale.points_earned > 0) {
      const poinStr = `+${sale.points_earned} Poin`;
      commands.push({ type: "text", text: `${padRight("Poin Diperoleh", LINE_WIDTH - poinStr.length)}${poinStr}`, newline: true });
    }
    if (sale.points_redeemed && sale.points_redeemed > 0) {
      const poinStr = `-${sale.points_redeemed} Poin`;
      commands.push({ type: "text", text: `${padRight("Poin Ditukar", LINE_WIDTH - poinStr.length)}${poinStr}`, newline: true });
    }
  }
  
  // === FOOTER ===
  commands.push({ type: "text", text: DIVIDER, align: "center", newline: true });
  // Removed commands.push({ type: "feed", lines: 1 });
  if (profile.footer_note) {
    commands.push({ type: "text", text: profile.footer_note, align: "center", newline: true });
    // Removed commands.push({ type: "feed", lines: 1 });
  }
  commands.push({ type: "text", text: "Terima kasih!", align: "center", newline: true });
  commands.push({ type: "feed", lines: 2 });
  commands.push({ type: "cut" });

  return commands;
};

const buildDigitalReceiptCommands = (
  trx: DigitalTransaction,
  profile: ShopProfile
): RawBTCommand[] => {
  const commands: RawBTCommand[] = [];

  // === HEADER ===
  commands.push({ type: "text", text: profile.name.toUpperCase() || "TOKO", align: "center", bold: true, size: "double-width", newline: true });
  if (profile.address) commands.push({ type: "text", text: profile.address, align: "center", newline: true });
  if (profile.phone_number) commands.push({ type: "text", text: `Telp: ${profile.phone_number}`, align: "center", newline: true });
  // Removed commands.push({ type: "feed", lines: 1 });
  
  const trxLine = `No: ${trx.id} Kasir: ${profile.cashier_name || "Admin"}`;
  commands.push({ type: "text", text: trxLine, align: "left", newline: true });
  commands.push({ type: "text", text: formatDate(trx.created_at), align: "left", newline: true });
  commands.push({ type: "text", text: DIVIDER, align: "center", newline: true });

  // === TRANSACTION INFO ===
  commands.push({ type: "text", text: `Layanan: ${trx.category}`, newline: true });
  commands.push({ type: "text", text: `Produk: ${trx.provider}`, newline: true });
  commands.push({ type: "text", text: `No/ID: ${trx.phone_number}`, bold: true, newline: true });
  if (trx.customer_name) commands.push({ type: "text", text: `Pelanggan: ${trx.customer_name}`, newline: true });

  // === PRICING ===
  commands.push({ type: "text", text: DIVIDER, align: "center", newline: true });
  const priceStr = formatCurrency(trx.selling_price);
  commands.push({ type: "text", text: `${padRight("Total", LINE_WIDTH - priceStr.length)}${priceStr}`, bold: true, newline: true });

  // === NOTES / TOKEN ===
  if (trx.notes) {
    commands.push({ type: "text", text: DIVIDER, align: "center", newline: true });
    commands.push({ type: "text", text: "TOKEN/KETERANGAN:", align: "center", bold: true, newline: true });
    commands.push({ type: "text", text: trx.notes, align: "center", size: 'double-width', bold: true, newline: true });
  }

  // === FOOTER ===
  commands.push({ type: "text", text: DIVIDER, align: "center", newline: true });
  // Removed commands.push({ type: "feed", lines: 1 });
  if (profile.footer_note) {
    commands.push({ type: "text", text: profile.footer_note, align: "center", newline: true });
    // Removed commands.push({ type: "feed", lines: 1 });
  }
  commands.push({ type: "text", text: "Terima kasih!", align: "center", newline: true });
  commands.push({ type: "feed", lines: 2 });
  commands.push({ type: "cut" });

  return commands;
};


// ============================================
// HTML Generators (for expo-print fallback)
// ============================================

const generateSaleReceiptHTML = (
  sale: Sale & { payment_method_name?: string },
  items: any[],
  profile: ShopProfile
) => {
  const itemsHtml = items
    .map(
      (item) => `
    <div class="item">
      <div class="item-name">${item.product_name || "Produk"}</div>
      <div class="item-details">
        <span>${item.qty} x ${formatCurrency(item.price)}</span>
        <span>${formatCurrency(item.subtotal)}</span>
      </div>
    </div>
  `
    )
    .join("");
  
  const pointsHtml = `
    ${((sale.points_earned && sale.points_earned > 0) || (sale.points_redeemed && sale.points_redeemed > 0)) && profile.poin_enabled !== 0 ? '<div class="divider"></div>' : ''}
    ${(sale.points_earned && sale.points_earned > 0) && profile.poin_enabled !== 0 ? `<div class="row"><span>Poin Diperoleh</span><span>+${sale.points_earned} Poin</span></div>` : ""}
    ${(sale.points_redeemed && sale.points_redeemed > 0) && profile.poin_enabled !== 0 ? `<div class="row"><span>Poin Ditukar</span><span>-${sale.points_redeemed} Poin</span></div>` : ""}
  `;

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 0; }
          body { font-family: 'monospace'; font-size: 10px; color: #000; width: 58mm; padding: 5px; box-sizing: border-box; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          
          .header { text-align: center; margin-bottom: 8px; }
          .header .shop-name { font-size: 16px; font-weight: bold; }
          .header p { margin: 1px 0; font-size: 10px; }

          .meta-info { font-size: 10px; margin-bottom: 8px;}
          .meta-info p { margin: 1px 0; }
          
          .item { margin-bottom: 4px; }
          .item-name { font-weight: bold; }
          .item-details { display: flex; justify-content: space-between; }

          .totals .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .totals .row.total { font-weight: bold; font-size: 12px; margin-top: 4px; }
          
          .footer { text-align: center; margin-top: 10px; font-size: 10px; }
          .footer p { margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name uppercase">${profile.name || "TOKO"}</div>
          ${profile.address ? `<p>${profile.address}</p>` : ""}
          ${profile.phone_number ? `<p>Telp: ${profile.phone_number}</p>` : ""}
        </div>
        <div class="meta-info">
          <p>No: ${sale.id} Kasir: ${profile.cashier_name || "Admin"}</p>
          <p>${formatDate(sale.created_at)}</p>
        </div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="totals">
          <div class="row"><span>Total</span><span>${formatCurrency(sale.total)}</span></div>
          <div class="row"><span>Bayar</span><span>${formatCurrency(sale.paid)}</span></div>
          <div class="row"><span>Kembali</span><span>${formatCurrency(sale.change)}</span></div>
          <div class="row"><span>Metode</span><span>${sale.payment_method_name || "-"}</span></div>
        </div>
        ${pointsHtml}
        <div class="divider"></div>
        <div class="footer">
          ${profile.footer_note ? `<p>${profile.footer_note.replace(/\n/g, "<br>")}</p>` : ""}
          <p>Terima kasih!</p>
        </div>
      </body>
    </html>
  `;
};

const generateDigitalReceiptHTML = (
  trx: DigitalTransaction,
  profile: ShopProfile
) => {
  const notesHtml = trx.notes ? `
    <div class="divider"></div>
    <div class="notes-box">
      <div class="bold center">TOKEN/KETERANGAN:</div>
      <div class="bold center" style="font-size: 14px; margin-top: 4px;">${trx.notes}</div>
    </div>
  ` : '';

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 0; }
          body { font-family: 'monospace'; font-size: 10px; color: #000; width: 58mm; padding: 5px; box-sizing: border-box; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }

          .header { text-align: center; margin-bottom: 8px; }
          .header .shop-name { font-size: 16px; font-weight: bold; }
          .header p { margin: 1px 0; font-size: 10px; }

          .meta-info { font-size: 10px; margin-bottom: 8px;}
          .meta-info p { margin: 1px 0; }
          
          .info-table .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .info-table .row span:first-child { min-width: 80px; }

          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 4px; }
          .notes-box { margin-top: 8px; }
          
          .footer { text-align: center; margin-top: 10px; font-size: 10px; }
          .footer p { margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name uppercase">${profile.name || "TOKO"}</div>
          ${profile.address ? `<p>${profile.address}</p>` : ""}
          ${profile.phone_number ? `<p>Telp: ${profile.phone_number}</p>` : ""}
        </div>
        <div class="meta-info">
          <p>No: ${trx.id} Kasir: ${profile.cashier_name || "Admin"}</p>
          <p>${formatDate(trx.created_at)}</p>
        </div>
        <div class="divider"></div>
        <div class="info-table">
          <div class="row"><span>Layanan</span><span>${trx.category}</span></div>
          <div class="row"><span>Produk</span><span>${trx.provider}</span></div>
          <div class="row"><span>No/ID</span><span class="bold">${trx.phone_number}</span></div>
          ${trx.customer_name ? `<div class="row"><span>Pelanggan</span><span>${trx.customer_name}</span></div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="total-row"><span>Total</span><span>${formatCurrency(trx.selling_price)}</span></div>
        ${notesHtml}
        <div class="divider"></div>
        <div class="footer">
          ${profile.footer_note ? `<p>${profile.footer_note.replace(/\n/g, "<br>")}</p>` : ""}
          <p>Terima kasih!</p>
        </div>
      </body>
    </html>
  `;
};

// ============================================
// Main Print Functions (Public API)
// ============================================

let isPrinting = false;

export const printSaleReceipt = async (
  sale: Sale & { payment_method_name?: string },
  items: any[]
) => {
  if (isPrinting) {
    console.warn("Gagal mencetak struk: [Error: Another print request is already in progress]");
    throw new Error("Another print request is already in progress");
  }

  isPrinting = true;

  try {
    const profile = await getShopProfile();
    if (!profile) {
      throw new Error("Shop profile not found.");
    }
    
    // Try RawBT first
    const commands = buildSaleReceiptCommands(sale, items, profile);
    const rawbtSuccess = await sendToRawBT(commands);
    if (rawbtSuccess) return;

    // Fallback to expo-print
    console.log("📄 Printing with expo-print...");
    const htmlContent = generateSaleReceiptHTML(sale, items, profile);
    await Print.printAsync({ html: htmlContent });

  } catch (error) {
    console.error("Gagal mencetak struk:", error);
    throw error;
  } finally {
    isPrinting = false;
  }
};

export const printDigitalReceipt = async (trx: DigitalTransaction) => {
  if (isPrinting) {
    console.warn("Gagal mencetak struk: [Error: Another print request is already in progress]");
    throw new Error("Another print request is already in progress");
  }

  isPrinting = true;

  try {
    const profile = await getShopProfile();
    if (!profile) {
      throw new Error("Shop profile not found.");
    }

    // Try RawBT first
    const commands = buildDigitalReceiptCommands(trx, profile);
    const rawbtSuccess = await sendToRawBT(commands);
    if (rawbtSuccess) return;

    // Fallback to expo-print
    console.log("📄 Printing with expo-print...");
    const htmlContent = generateDigitalReceiptHTML(trx, profile);
    await Print.printAsync({ html: htmlContent });

  } catch (error) {
    console.error("Gagal mencetak struk:", error);
    throw error;
  } finally {
    isPrinting = false;
  }
};