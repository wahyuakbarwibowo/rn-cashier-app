import * as Print from 'expo-print';
import { DigitalTransaction } from '../database/pulsa';
import { getShopProfile } from '../database/settings';
import { Sale } from '../types/database';

// ============================================
// RawBT Command Types
// ============================================
type RawBTCommand =
  | { type: 'text'; text: string; align?: 'left' | 'center' | 'right'; bold?: boolean; size?: 'normal' | 'double'; newline?: boolean }
  | { type: 'qr'; text: string; align?: 'left' | 'center' | 'right'; newline?: boolean }
  | { type: 'barcode'; text: string; align?: 'left' | 'center' | 'right'; newline?: boolean }
  | { type: 'cut' }
  | { type: 'feed'; lines?: number };

// ============================================
// RawBT HTTP Client
// ============================================
// Network configuration for RawBT HTTP server
// 
// For Physical Device (RawBT on same device):
const RAWBT_HOST = '127.0.0.1'; // localhost on the same device
//
// For Physical Device (RawBT on computer):
// const RAWBT_HOST = '192.168.8.102'; // Your computer's IP
//
// For Android Emulator (RawBT on host machine):
// const RAWBT_HOST = '10.0.2.2'; // Emulator -> host machine
//
// For iOS Simulator (RawBT on host machine):
// const RAWBT_HOST = 'host.docker.internal'; // Simulator -> host machine

const RAWBT_PORT = '8080';
const RAWBT_URL = `http://${RAWBT_HOST}:${RAWBT_PORT}/print`;
const RAWBT_TIMEOUT = 5000; // 5 seconds

/**
 * Send print commands to RawBT via HTTP POST
 * Expects JSON format and returns JSON response
 * @returns true if successful, false if RawBT is not available
 */
const sendToRawBT = async (commands: RawBTCommand[]): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RAWBT_TIMEOUT);

    console.log('📡 [RawBT] Sending request to:', RAWBT_URL);
    console.log('📡 [RawBT] Commands count:', commands.length);
    console.log('📡 [RawBT] First 3 commands:', JSON.stringify(commands.slice(0, 3), null, 2));

    const response = await fetch(RAWBT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📬 [RawBT] HTTP Status:', response.status, response.ok ? '(OK)' : '(ERROR)');
    console.log('📬 [RawBT] Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    // Read response as text first to handle non-JSON responses
    const responseText = await response.text();
    console.log('📬 [RawBT] Raw response:', responseText);

    if (!response.ok) {
      console.error('❌ [RawBT] HTTP error:', response.status, responseText);
      throw new Error(`RawBT HTTP error: ${response.status} - ${responseText}`);
    }

    // Try to parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('📬 [RawBT] Parsed JSON response:', result);
    } catch (parseError) {
      console.warn('⚠️ [RawBT] Response is not JSON, but HTTP 200 - considering success');
      console.log('✅ [RawBT] Printed successfully (non-JSON response)');
      return true;
    }

    // Check for success status
    if (result.status === 'success') {
      console.log('✅ [RawBT] Printed successfully (status: success)');
      return true;
    }

    // If response doesn't have status field but HTTP 200, consider it success
    console.log('✅ [RawBT] Printed successfully (HTTP 200, status field:', result.status || 'not present', ')');
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ [RawBT] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.warn('⚠️ [RawBT] Fallback to expo-print');
    return false;
  }
};

// ============================================
// Utility Functions
// ============================================
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number) => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

// ============================================
// RawBT Command Builders
// ============================================

/**
 * Build RawBT commands for sale receipt
 */
const buildSaleReceiptCommands = (
  sale: Sale & { payment_method_name?: string },
  items: any[],
  profile: {
    name: string;
    cashier_name: string;
    footer_note: string;
    phone_number: string;
    address: string;
  }
): RawBTCommand[] => {
  const commands: RawBTCommand[] = [];

  // === HEADER ===
  commands.push({
    type: 'text',
    text: profile.name || 'AMINMART',
    align: 'center',
    bold: true,
    size: 'double',
    newline: true,
  });

  if (profile.cashier_name) {
    commands.push({
      type: 'text',
      text: `Kasir: ${profile.cashier_name}`,
      align: 'center',
      newline: true,
    });
  }

  commands.push({
    type: 'text',
    text: `TRX #${sale.id}`,
    align: 'center',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: formatDate(sale.created_at),
    align: 'center',
    newline: true,
  });

  if (profile.phone_number) {
    commands.push({
      type: 'text',
      text: `Telp: ${profile.phone_number}`,
      align: 'center',
      newline: true,
    });
  }

  if (profile.address) {
    commands.push({
      type: 'text',
      text: profile.address,
      align: 'center',
      newline: true,
    });
  }

  commands.push({
    type: 'text',
    text: '--------------------------------',
    align: 'center',
    newline: true,
  });

  // === ITEMS ===
  items.forEach((item) => {
    commands.push({
      type: 'text',
      text: item.product_name || 'Produk',
      align: 'left',
      bold: true,
      newline: true,
    });
    commands.push({
      type: 'text',
      text: `${item.qty} x ${formatCurrency(item.price)}`,
      align: 'left',
      newline: false,
    });
    commands.push({
      type: 'text',
      text: formatCurrency(item.subtotal),
      align: 'right',
      newline: true,
    });
  });

  commands.push({
    type: 'text',
    text: '--------------------------------',
    align: 'center',
    newline: true,
  });

  // === PAYMENT & TOTALS ===
  commands.push({
    type: 'text',
    text: `Metode: ${sale.payment_method_name || '-'}`,
    align: 'left',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `SUBTOTAL: ${formatCurrency(sale.total)}`,
    align: 'left',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `TOTAL: ${formatCurrency(sale.total)}`,
    align: 'center',
    bold: true,
    size: 'double',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `BAYAR: ${formatCurrency(sale.paid)}`,
    align: 'left',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `KEMBALI: ${formatCurrency(sale.change)}`,
    align: 'left',
    newline: true,
  });

  // === POINTS (if any) ===
  if (sale.points_earned && sale.points_earned > 0) {
    commands.push({
      type: 'text',
      text: `POIN: +${sale.points_earned} pts`,
      align: 'center',
      newline: true,
    });
  }

  if (sale.points_redeemed && sale.points_redeemed > 0) {
    commands.push({
      type: 'text',
      text: `POIN DITUKAR: -${sale.points_redeemed} pts`,
      align: 'center',
      newline: true,
    });
  }

  // === FOOTER ===
  commands.push({
    type: 'text',
    text: '--------------------------------',
    align: 'center',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: profile.footer_note || 'Terima Kasih',
    align: 'center',
    newline: true,
  });

  // Cut paper
  commands.push({ type: 'cut' });

  return commands;
};

/**
 * Build RawBT commands for digital transaction receipt
 */
const buildDigitalReceiptCommands = (
  trx: DigitalTransaction,
  profile: {
    name: string;
    cashier_name: string;
    footer_note: string;
    phone_number: string;
    address: string;
  }
): RawBTCommand[] => {
  const commands: RawBTCommand[] = [];

  // === HEADER ===
  commands.push({
    type: 'text',
    text: profile.name || 'AMINMART',
    align: 'center',
    bold: true,
    size: 'double',
    newline: true,
  });

  if (profile.cashier_name) {
    commands.push({
      type: 'text',
      text: `Kasir: ${profile.cashier_name}`,
      align: 'center',
      newline: true,
    });
  }

  commands.push({
    type: 'text',
    text: `TRX #${trx.id}`,
    align: 'center',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: formatDate(trx.created_at),
    align: 'center',
    newline: true,
  });

  if (profile.phone_number) {
    commands.push({
      type: 'text',
      text: `Telp: ${profile.phone_number}`,
      align: 'center',
      newline: true,
    });
  }

  if (profile.address) {
    commands.push({
      type: 'text',
      text: profile.address,
      align: 'center',
      newline: true,
    });
  }

  commands.push({
    type: 'text',
    text: '--------------------------------',
    align: 'center',
    newline: true,
  });

  // === TRANSACTION INFO ===
  commands.push({
    type: 'text',
    text: `Pelanggan: ${trx.customer_name || '-'}`,
    align: 'left',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `No/ID: ${trx.phone_number}`,
    align: 'left',
    bold: true,
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `Layanan: ${trx.category}`,
    align: 'left',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `Produk: ${trx.provider}`,
    align: 'left',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `Nominal: ${formatCurrency(trx.amount)}`,
    align: 'left',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: '--------------------------------',
    align: 'center',
    newline: true,
  });

  // === PRICING ===
  commands.push({
    type: 'text',
    text: `Harga Modal: ${formatCurrency(trx.cost_price)}`,
    align: 'left',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `Harga Jual: ${formatCurrency(trx.selling_price)}`,
    align: 'left',
    bold: true,
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `Keuntungan: ${formatCurrency(trx.profit)}`,
    align: 'left',
    bold: true,
    newline: true,
  });

  commands.push({
    type: 'text',
    text: '--------------------------------',
    align: 'center',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: `TOTAL: ${formatCurrency(trx.selling_price)}`,
    align: 'center',
    bold: true,
    size: 'double',
    newline: true,
  });

  // === NOTES / TOKEN ===
  if (trx.notes) {
    commands.push({
      type: 'text',
      text: '--------------------------------',
      align: 'center',
      newline: true,
    });
    commands.push({
      type: 'text',
      text: 'TOKEN / KETERANGAN:',
      align: 'center',
      bold: true,
      newline: true,
    });
    commands.push({
      type: 'text',
      text: trx.notes,
      align: 'center',
      newline: true,
    });
  }

  // === FOOTER ===
  commands.push({
    type: 'text',
    text: '--------------------------------',
    align: 'center',
    newline: true,
  });

  commands.push({
    type: 'text',
    text: profile.footer_note || 'Terima Kasih',
    align: 'center',
    newline: true,
  });

  // Cut paper
  commands.push({ type: 'cut' });

  return commands;
};

// ============================================
// HTML Generators (for expo-print fallback)
// ============================================

const generateSaleReceiptHTML = (
  sale: Sale & { payment_method_name?: string },
  items: any[],
  profile: {
    name: string;
    cashier_name: string;
    footer_note: string;
    phone_number: string;
    address: string;
  }
) => {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td colspan="2" style="font-weight: bold;">${item.product_name || 'Produk'}</td>
    </tr>
    <tr>
      <td style="padding-bottom: 2px;">${item.qty} x ${formatCurrency(item.price)}</td>
      <td style="text-align: right; vertical-align: bottom; padding-bottom: 2px;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 0; }
          body {
            font-family: 'monospace';
            padding: 5px;
            width: 300px;
            margin: 0 auto;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .shop-name { font-size: 50px; font-weight: bold; text-transform: uppercase; }
          .cashier-name { font-size: 30px; margin-top: 1px; }
          .trx-meta { font-size: 26px; margin-top: 1px; }
          .items-table { width: 100%; font-size: 30px; border-collapse: collapse; margin: 5px 0; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; font-size: 30px; margin-bottom: 2px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 38px; margin-top: 3px; }
          .footer { text-align: center; margin-top: 10px; font-size: 22px; line-height: 1.3; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${profile.name}</div>
          ${profile.cashier_name ? `<div class="cashier-name">Kasir: ${profile.cashier_name}</div>` : ''}
          <div class="trx-meta">TRX #${sale.id} | ${formatDate(sale.created_at)}</div>
        </div>
        ${profile.phone_number ? `<div style="text-align: center; font-size: 26px; margin-bottom: 1px;">Telp: ${profile.phone_number}</div>` : ''}
        ${profile.address ? `<div style="text-align: center; font-size: 26px; margin-bottom: 2px; word-wrap: break-word;">${profile.address}</div>` : ''}
        <table class="items-table">${itemsHtml}</table>
        <div class="divider"></div>
        <div class="row">
          <span>Metode</span>
          <span>${sale.payment_method_name || '-'}</span>
        </div>
        <div class="row">
          <span>SUBTOTAL</span>
          <span>${formatCurrency(sale.total)}</span>
        </div>
        <div class="total-row">
          <span>TOTAL</span>
          <span>${formatCurrency(sale.total)}</span>
        </div>
        <div class="row" style="margin-top: 8px;">
          <span>BAYAR</span>
          <span>${formatCurrency(sale.paid)}</span>
        </div>
        <div class="row">
          <span>KEMBALI</span>
          <span>${formatCurrency(sale.change)}</span>
        </div>
        ${sale.points_earned && sale.points_earned > 0 ? `<div class="row"><span>POIN</span><span>+${sale.points_earned} pts</span></div>` : ''}
        ${sale.points_redeemed && sale.points_redeemed > 0 ? `<div class="row"><span>POIN DITUKAR</span><span>-${sale.points_redeemed} pts</span></div>` : ''}
        <div class="divider"></div>
        <div class="footer">${profile.footer_note.replace(/\n/g, '<br>')}</div>
      </body>
    </html>
  `;
};

const generateDigitalReceiptHTML = (
  trx: DigitalTransaction,
  profile: {
    name: string;
    cashier_name: string;
    footer_note: string;
    phone_number: string;
    address: string;
  }
) => {
  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 0; }
          body {
            font-family: 'monospace';
            padding: 5px;
            width: 300px;
            margin: 0 auto;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .shop-name { font-size: 50px; font-weight: bold; text-transform: uppercase; }
          .cashier-name { font-size: 30px; margin-top: 1px; }
          .trx-meta { font-size: 26px; margin-top: 1px; }
          .info-table { width: 100%; font-size: 30px; border-collapse: collapse; margin: 5px 0; }
          .info-table td { padding: 4px 0; vertical-align: top; }
          .label { width: 40%; color: #333; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 38px; padding: 3px 0; }
          .notes-box {
            margin-top: 5px;
            padding: 5px;
            border: 1px solid #000;
            text-align: center;
          }
          .notes-title { font-size: 26px; font-weight: bold; margin-bottom: 2px; }
          .notes-content { font-size: 36px; font-weight: bold; letter-spacing: 1px; }
          .footer { text-align: center; margin-top: 10px; font-size: 22px; line-height: 1.3; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${profile.name}</div>
          ${profile.cashier_name ? `<div class="cashier-name">Kasir: ${profile.cashier_name}</div>` : ''}
          <div class="trx-meta">TRX #${trx.id} | ${formatDate(trx.created_at)}</div>
        </div>
        ${profile.phone_number ? `<div style="text-align: center; font-size: 26px; margin-bottom: 1px;">Telp: ${profile.phone_number}</div>` : ''}
        ${profile.address ? `<div style="text-align: center; font-size: 26px; margin-bottom: 2px; word-wrap: break-word;">${profile.address}</div>` : ''}
        <table class="info-table">
          <tr><td class="label">Pelanggan:</td><td>${trx.customer_name || '-'}</td></tr>
          <tr><td class="label">No/ID:</td><td style="font-weight: bold;">${trx.phone_number}</td></tr>
          <tr><td class="label">Layanan:</td><td>${trx.category}</td></tr>
          <tr><td class="label">Produk:</td><td>${trx.provider}</td></tr>
          <tr><td class="label">Nominal:</td><td>${formatCurrency(trx.amount)}</td></tr>
        </table>
        <div class="divider"></div>
        <div class="total-row"><span>Harga Modal</span><span>${formatCurrency(trx.cost_price)}</span></div>
        <div class="total-row"><span>Harga Jual</span><span>${formatCurrency(trx.selling_price)}</span></div>
        <div class="total-row"><span>Keuntungan</span><span>${formatCurrency(trx.profit)}</span></div>
        <div class="divider"></div>
        <div class="total-row"><span>TOTAL</span><span>${formatCurrency(trx.selling_price)}</span></div>
        ${trx.notes ? `
          <div class="notes-box">
            <div class="notes-title">TOKEN / KETERANGAN:</div>
            <div class="notes-content">${trx.notes}</div>
          </div>
          <div class="divider"></div>
        ` : ''}
        <div class="footer">${profile.footer_note.replace(/\n/g, '<br>')}</div>
      </body>
    </html>
  `;
};

// ============================================
// Main Print Functions (Public API)
// ============================================

// Module-level flag to prevent concurrent print requests
let isPrinting = false;

/**
 * Print sale receipt with RawBT priority and expo-print fallback
 */
export const printSaleReceipt = async (
  sale: Sale & { payment_method_name?: string },
  items: any[]
) => {
  // Check if another print request is already in progress
  if (isPrinting) {
    console.warn('Gagal mencetak struk: [Error: Another print request is already in progress]');
    throw new Error('Another print request is already in progress');
  }

  isPrinting = true;

  try {
    const profile = await getShopProfile();
    const shopProfile = {
      name: profile?.name || 'AMINMART',
      cashier_name: profile?.cashier_name || '',
      footer_note: profile?.footer_note || 'Terima Kasih Atas Kepercayaan Anda',
      phone_number: profile?.phone_number || '',
      address: profile?.address || '',
    };

    // Build RawBT commands
    const commands = buildSaleReceiptCommands(sale, items, shopProfile);

    // Try RawBT first
    const rawbtSuccess = await sendToRawBT(commands);
    if (rawbtSuccess) {
      return;
    }

    // Fallback to expo-print
    console.log('📄 Printing with expo-print...');
    const htmlContent = generateSaleReceiptHTML(sale, items, shopProfile);
    await Print.printAsync({
      html: htmlContent,
      width: 302,
    });
  } catch (error) {
    console.error('Gagal mencetak struk:', error);
    throw error;
  } finally {
    isPrinting = false;
  }
};

/**
 * Print digital transaction receipt with RawBT priority and expo-print fallback
 */
export const printDigitalReceipt = async (trx: DigitalTransaction) => {
  // Check if another print request is already in progress
  if (isPrinting) {
    console.warn('Gagal mencetak struk: [Error: Another print request is already in progress]');
    throw new Error('Another print request is already in progress');
  }

  isPrinting = true;

  try {
    const profile = await getShopProfile();
    const shopProfile = {
      name: profile?.name || 'AMINMART',
      cashier_name: profile?.cashier_name || '',
      footer_note: profile?.footer_note || 'Terima Kasih Atas Kepercayaan Anda',
      phone_number: profile?.phone_number || '',
      address: profile?.address || '',
    };

    // Build RawBT commands
    const commands = buildDigitalReceiptCommands(trx, shopProfile);

    // Try RawBT first
    const rawbtSuccess = await sendToRawBT(commands);
    if (rawbtSuccess) {
      return;
    }

    // Fallback to expo-print
    console.log('📄 Printing with expo-print...');
    const htmlContent = generateDigitalReceiptHTML(trx, shopProfile);
    await Print.printAsync({
      html: htmlContent,
      width: 302,
    });
  } catch (error) {
    console.error('Gagal mencetak struk:', error);
    throw error;
  } finally {
    isPrinting = false;
  }
};
