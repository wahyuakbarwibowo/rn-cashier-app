import { DigitalTransaction } from '../database/pulsa';
import { getShopProfile } from '../database/settings';
import { Sale } from '../types/database';
import { Alert } from 'react-native';
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from '@vardrz/react-native-bluetooth-escpos-printer';

let isPrinting = false;
let connectedDevice: any = null;

export const setConnectedDevice = (device: any) => {
  connectedDevice = device;
};

export const getConnectedDevice = () => {
  return connectedDevice;
};

export const connectToPrinter = async (address: string) => {
  try {
    await BluetoothManager.connect(address);
    return true;
  } catch (e) {
    console.error("Connection error:", e);
    return false;
  }
};

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

const LINE = "--------------------------------\n";

export const printDigitalReceipt = async (trx: DigitalTransaction) => {
  if (isPrinting) return;
  if (!connectedDevice) {
    Alert.alert("Printer Belum Terhubung", "Silakan pilih printer bluetooth terlebih dahulu.");
    return "NO_PRINTER";
  }

  isPrinting = true;
  try {
    const profile = await getShopProfile();
    const shopName = profile?.name || "KASIR KU";
    const cashierName = profile?.cashier_name || "";
    const footerNote = profile?.footer_note || "Terima Kasih Atas Kepercayaan Anda";
    const shopPhoneNumber = profile?.phone_number || "";
    const shopAddress = profile?.address || "";

    await BluetoothEscposPrinter.printerInit();
    
    // Header
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${shopName}\n`, {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1
    });
    
    if (shopAddress) {
        await BluetoothEscposPrinter.printText(`${shopAddress}\n`, {});
    }
    if (shopPhoneNumber) {
        await BluetoothEscposPrinter.printText(`Telp: ${shopPhoneNumber}\n`, {});
    }
    
    await BluetoothEscposPrinter.printText(LINE, {});
    
    if (cashierName) {
        await BluetoothEscposPrinter.printText(`Kasir: ${cashierName}\n`, {});
    }
    await BluetoothEscposPrinter.printText(`TRX #${trx.id}\n`, {});
    await BluetoothEscposPrinter.printText(`${formatDate(trx.created_at)}\n`, {});
    await BluetoothEscposPrinter.printText(LINE, {});

    // Info
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printColumn([12, 20], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT], 
        ["Pelanggan", `: ${trx.customer_name || "-"}`], {});
    await BluetoothEscposPrinter.printColumn([12, 20], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT], 
        ["No/ID", `: ${trx.phone_number}`], {});
    await BluetoothEscposPrinter.printColumn([12, 20], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT], 
        ["Layanan", `: ${trx.category}`], {});
    await BluetoothEscposPrinter.printColumn([12, 20], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT], 
        ["Produk", `: ${trx.provider}`], {});
    
    await BluetoothEscposPrinter.printText(LINE, {});

    // Total
    await BluetoothEscposPrinter.printColumn([12, 20], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], 
        ["TOTAL", `Rp ${trx.selling_price.toLocaleString("id-ID")}`], {
            widthtimes: 1,
            heigthtimes: 0,
            fonttype: 1
        });

    if (trx.notes) {
        await BluetoothEscposPrinter.printText(LINE, {});
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText("TOKEN / KETERANGAN:\n", { fonttype: 1 });
        await BluetoothEscposPrinter.printText(`${trx.notes}\n`, {
            widthtimes: 1,
            heigthtimes: 1,
            fonttype: 1
        });
    }

    await BluetoothEscposPrinter.printText(LINE, {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${footerNote}\n`, {});
    await BluetoothEscposPrinter.printText("\n\n\n", {});

  } catch (error) {
    console.error("Print error:", error);
    Alert.alert("Gagal Mencetak", "Terjadi kesalahan saat mencetak struk.");
  } finally {
    isPrinting = false;
  }
};

type SaleReceipt = Sale & {
  payment_method_name?: string;
};

export const printSaleReceipt = async (sale: SaleReceipt, items: any[]) => {
  if (isPrinting) return;
  if (!connectedDevice) {
    Alert.alert("Printer Belum Terhubung", "Silakan pilih printer bluetooth terlebih dahulu.");
    return "NO_PRINTER";
  }

  isPrinting = true;
  try {
    const profile = await getShopProfile();
    const shopName = profile?.name || "AMINMART";
    const cashierName = profile?.cashier_name || "";
    const footerNote = profile?.footer_note || "Terima Kasih Atas Kepercayaan Anda";
    const shopPhoneNumber = profile?.phone_number || "";
    const shopAddress = profile?.address || "";

    await BluetoothEscposPrinter.printerInit();
    
    // Header
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${shopName}\n`, {
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1
    });
    
    if (shopAddress) {
        await BluetoothEscposPrinter.printText(`${shopAddress}\n`, {});
    }
    if (shopPhoneNumber) {
        await BluetoothEscposPrinter.printText(`Telp: ${shopPhoneNumber}\n`, {});
    }
    
    await BluetoothEscposPrinter.printText(LINE, {});
    
    if (cashierName) {
        await BluetoothEscposPrinter.printText(`Kasir: ${cashierName}\n`, {});
    }
    await BluetoothEscposPrinter.printText(`TRX #${sale.id}\n`, {});
    await BluetoothEscposPrinter.printText(`${formatDate(sale.created_at)}\n`, {});
    await BluetoothEscposPrinter.printText(LINE, {});

    // Items
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    for (const item of items) {
        await BluetoothEscposPrinter.printText(`${item.product_name || 'Produk'}\n`, { fonttype: 1 });
        await BluetoothEscposPrinter.printColumn([16, 16], 
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], 
            [`${item.qty} x ${item.price.toLocaleString("id-ID")}`, `Rp ${item.subtotal.toLocaleString("id-ID")}`], {});
    }
    
    await BluetoothEscposPrinter.printText(LINE, {});

    // Summary
    await BluetoothEscposPrinter.printColumn([16, 16], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], 
        ["Metode", sale.payment_method_name || "-"], {});
    await BluetoothEscposPrinter.printColumn([16, 16], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], 
        ["TOTAL", `Rp ${sale.total.toLocaleString("id-ID")}`], { fonttype: 1 });
    await BluetoothEscposPrinter.printColumn([16, 16], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], 
        ["BAYAR", `Rp ${sale.paid.toLocaleString("id-ID")}`], {});
    await BluetoothEscposPrinter.printColumn([16, 16], 
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT], 
        ["KEMBALI", `Rp ${sale.change.toLocaleString("id-ID")}`], {});

    await BluetoothEscposPrinter.printText(LINE, {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${footerNote}\n`, {});
    await BluetoothEscposPrinter.printText("\n\n\n", {});

  } catch (error) {
    console.error("Print error:", error);
    Alert.alert("Gagal Mencetak", "Terjadi kesalahan saat mencetak struk.");
  } finally {
    isPrinting = false;
  }
};

export const printBarcode = async (productName: string, productCode: string, price: number) => {
  if (isPrinting) return;
  if (!connectedDevice) {
    Alert.alert("Printer Belum Terhubung", "Silakan pilih printer bluetooth terlebih dahulu.");
    return "NO_PRINTER";
  }

  isPrinting = true;
  try {
    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    
    await BluetoothEscposPrinter.printText(`${productName}\n`, { fonttype: 1 });
    
    // ESC/POS BARCODE command
    // Parameters: content, barcodeType, width, height, position, font
    // 73 is CODE128
    await BluetoothEscposPrinter.printBarcode(productCode, 73, 2, 60, 2, 1);
    
    await BluetoothEscposPrinter.printText(`\nRp ${price.toLocaleString("id-ID")}\n`, {
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1
    });
    
    await BluetoothEscposPrinter.printText("\n\n\n", {});

  } catch (error) {
    console.error("Print error:", error);
    Alert.alert("Gagal Mencetak", "Terjadi kesalahan saat mencetak barcode.");
  } finally {
    isPrinting = false;
  }
};
