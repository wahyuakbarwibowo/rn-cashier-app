import * as Print from 'expo-print';
import { DigitalTransaction } from '../database/pulsa';
import { getShopProfile } from '../database/settings';
import { Sale } from '../types/database';

// Module-level flag to prevent concurrent print requests
let isPrinting = false;

export const printDigitalReceipt = async (trx: DigitalTransaction) => {
  // Check if another print request is already in progress
  if (isPrinting) {
    console.warn("Gagal mencetak struk: [Error: Another print request is already in progress]");
    // Throw an error to indicate that the request could not be processed
    throw new Error("Another print request is already in progress");
  }

  // Set the flag to true to indicate a print request has started
  isPrinting = true;

  const profile = await getShopProfile();
  const shopName = profile?.name || "KASIR KU";
  const cashierName = profile?.cashier_name || "";
  const footerNote = profile?.footer_note || "Terima Kasih Atas Kepercayaan Anda";
  const shopPhoneNumber = profile?.phone_number || "";
  const shopAddress = profile?.address || "";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 0; }
          body {
            font-family: 'monospace';
            padding: 5px;
            width: 300px; /* Standard 58mm width in pixels approx */
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
          <div class="shop-name">${shopName}</div>
          ${cashierName ? `<div class="cashier-name">Kasir: ${cashierName}</div>` : ''}
          <div class="trx-meta">TRX #${trx.id} | ${formatDate(trx.created_at)}</div>
        </div>

        ${shopPhoneNumber ? `<div style="text-align: center; font-size: 26px; margin-bottom: 1px;">Telp: ${shopPhoneNumber}</div>` : ''}
        ${shopAddress ? `<div style="text-align: center; font-size: 26px; margin-bottom: 2px; word-wrap: break-word;">${shopAddress}</div>` : ''}

        <table class="info-table">
          <tr>
            <td class="label">Pelanggan:</td>
            <td>${trx.customer_name || "-"}</td>
          </tr>
          <tr>
            <td class="label">No/ID:</td>
            <td style="font-weight: bold;">${trx.phone_number}</td>
          </tr>
          <tr>
            <td class="label">Layanan:</td>
            <td>${trx.category}</td>
          </tr>
          <tr>
            <td class="label">Produk:</td>
            <td>${trx.provider}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <div class="total-row">
          <span>TOTAL</span>
          <span>Rp ${trx.selling_price.toLocaleString("id-ID")}</span>
        </div>

        ${trx.notes ? `
          <div class="notes-box">
            <div class="notes-title">TOKEN / KETERANGAN:</div>
            <div class="notes-content">${trx.notes}</div>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="footer">
          ${footerNote.replace(/\n/g, '<br>')}
        </div>
      </body>
    </html>
  `;

  try {
    await Print.printAsync({
      html: htmlContent,
      width: 302, // 58mm thermal width
    });
  } catch (error) {
    console.error("Gagal mencetak struk:", error);
    throw error; // Re-throw the error to be caught by the caller
  } finally {
    // Reset the flag regardless of success or failure
    isPrinting = false;
  }
};

type SaleReceipt = Sale & {
  payment_method_name?: string;
};

export const printSaleReceipt = async (sale: SaleReceipt, items: any[]) => {
  // Check if another print request is already in progress
  if (isPrinting) {
    console.warn("Gagal mencetak struk: [Error: Another print request is already in progress]");
    // Throw an error to indicate that the request could not be processed
    throw new Error("Another print request is already in progress");
  }

  // Set the flag to true to indicate a print request has started
  isPrinting = true;

  const profile = await getShopProfile();
  const shopName = profile?.name || "AMINMART";
  const cashierName = profile?.cashier_name || "";
  const footerNote = profile?.footer_note || "Terima Kasih Atas Kepercayaan Anda";
  const shopPhoneNumber = profile?.phone_number || "";
  const shopAddress = profile?.address || "";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const itemsHtml = items.map(item => `
    <tr>
      <td colspan="2" style="font-weight: bold;">${item.product_name || 'Produk'}</td>
    </tr>
    <tr>
      <td style="padding-bottom: 2px;">${item.qty} x Rp ${item.price.toLocaleString("id-ID")}</td>
      <td style="text-align: right; vertical-align: bottom; padding-bottom: 2px;">Rp ${item.subtotal.toLocaleString("id-ID")}</td>
    </tr>
  `).join('');

  const htmlContent = `
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
          <div class="shop-name">${shopName}</div>
          ${cashierName ? `<div class="cashier-name">Kasir: ${cashierName}</div>` : ''}
          <div class="trx-meta">TRX #${sale.id} | ${formatDate(sale.created_at)}</div>
        </div>

        ${shopPhoneNumber ? `<div style="text-align: center; font-size: 26px; margin-bottom: 1px;">Telp: ${shopPhoneNumber}</div>` : ''}
        ${shopAddress ? `<div style="text-align: center; font-size: 26px; margin-bottom: 2px; word-wrap: break-word;">${shopAddress}</div>` : ''}

        <table class="items-table">
          ${itemsHtml}
        </table>

        <div class="divider"></div>

        <div class="row">
          <span>Metode</span>
          <span>${sale.payment_method_name || "-"}</span>
        </div>

        <div class="row">
          <span>SUBTOTAL</span>
          <span>Rp ${sale.total.toLocaleString("id-ID")}</span>
        </div>
        <div class="total-row">
          <span>TOTAL</span>
          <span>Rp ${sale.total.toLocaleString("id-ID")}</span>
        </div>
        
        <div class="row" style="margin-top: 8px;">
          <span>BAYAR</span>
          <span>Rp ${sale.paid.toLocaleString("id-ID")}</span>
        </div>
        <div class="row">
          <span>KEMBALI</span>
          <span>Rp ${sale.change.toLocaleString("id-ID")}</span>
        </div>

        <div class="divider"></div>

        <div class="footer">
          ${footerNote.replace(/\n/g, '<br>')}
        </div>
      </body>
    </html>
  `;

  try {
    await Print.printAsync({
      html: htmlContent,
      width: 302,
    });
  } catch (error) {
    console.error("Gagal mencetak struk:", error);
    throw error; // Re-throw the error to be caught by the caller
  } finally {
    // Reset the flag regardless of success or failure
    isPrinting = false;
  }
};
