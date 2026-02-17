import { PermissionsAndroid, Platform, Alert } from 'react-native';
import BluetoothEscposPrinter, {
  BluetoothConnectOption,
} from 'react-native-bluetooth-escpos-printer';
import { DigitalTransaction } from '../database/pulsa';
import { getShopProfile } from '../database/settings';
import { Sale } from '../types/database';

// Module-level flag to prevent concurrent print requests
let isPrinting = false;
let connectedDeviceAddress: string | null = null;

// ESC/POS Commands
const ESC_POS = {
  INIT: '\x1B\x40',
  ALIGN: {
    LEFT: '\x1B\x61\x00',
    CENTER: '\x1B\x61\x01',
    RIGHT: '\x1B\x61\x02',
  },
  TEXT_FORMAT: {
    NORMAL: '\x1B\x21\x00',
    BOLD: '\x1B\x21\x08',
    BOLD_DOUBLE: '\x1B\x21\x18',
    DOUBLE_WIDTH: '\x1B\x21\x10',
    DOUBLE_HEIGHT: '\x1B\x21\x20',
    UNDERLINE: '\x1B\x2D\x01',
    UNDERLINE_OFF: '\x1B\x2D\x00',
  },
  LINE_HEIGHT: '\x1B\x33\x30',
  CUT: '\x1D\x56\x41',
  FEED: '\x1B\x64\x03',
};

const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const androidVersion = Platform.Version as number;
    
    if (androidVersion >= 31) { // Android 12+
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);
      
      return (
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else if (androidVersion >= 23) { // Android 6-11
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        'android.permission.BLUETOOTH' as any,
        'android.permission.BLUETOOTH_ADMIN' as any,
      ]) as any;
      
      return (
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    
    return true;
  } catch (err) {
    console.error('Permission error:', err);
    return false;
  }
};

export const scanDevices = async () => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Bluetooth permission denied');
  }

  try {
    await BluetoothEscposPrinter.stopScan();
    
    return new Promise<any[]>((resolve, reject) => {
      const devices: any[] = [];
      let timeoutId: NodeJS.Timeout;
      
      // Listen for found devices
      const listener = BluetoothEscposPrinter.addListener(
        'BluetoothEscposPrinterFoundDevice',
        (device: any) => {
          if (device && device.name && device.address) {
            devices.push(device);
          }
        }
      );
      
      // Stop scanning after 5 seconds
      timeoutId = setTimeout(async () => {
        listener.remove();
        await BluetoothEscposPrinter.stopScan();
        resolve(devices);
      }, 5000);
      
      // Start scanning
      BluetoothEscposPrinter.scan()
        .catch((err: any) => {
          clearTimeout(timeoutId);
          listener.remove();
          reject(err);
        });
    });
  } catch (error) {
    console.error('Scan error:', error);
    throw error;
  }
};

export const connectToDevice = async (address: string): Promise<boolean> => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Bluetooth permission denied');
  }

  try {
    await BluetoothEscposPrinter.connect(address, {});
    connectedDeviceAddress = address;
    return true;
  } catch (error: any) {
    console.error('Connect error:', error);
    if (error.message?.includes('already connected')) {
      connectedDeviceAddress = address;
      return true;
    }
    throw error;
  }
};

export const disconnectDevice = async (): Promise<void> => {
  try {
    await BluetoothEscposPrinter.disconnect();
    connectedDeviceAddress = null;
  } catch (error) {
    console.error('Disconnect error:', error);
  }
};

export const getConnectedDevice = (): string | null => {
  return connectedDeviceAddress;
};

const formatCurrency = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const printDigitalReceipt = async (trx: DigitalTransaction) => {
  if (isPrinting) {
    console.warn('Print request already in progress');
    throw new Error('Another print request is already in progress');
  }

  isPrinting = true;

  try {
    // Check connection
    if (!connectedDeviceAddress) {
      throw new Error('Printer tidak terhubung. Silakan connect ke printer terlebih dahulu.');
    }

    const profile = await getShopProfile();
    const shopName = profile?.name || 'KASIR KU';
    const cashierName = profile?.cashier_name || '';
    const footerNote = profile?.footer_note || 'Terima Kasih Atas Kepercayaan Anda';
    const shopPhoneNumber = profile?.phone_number || '';
    const shopAddress = profile?.address || '';

    // Build receipt content
    let receipt = '';

    // Initialize
    receipt += ESC_POS.INIT;
    receipt += ESC_POS.ALIGN.CENTER;

    // Shop name (bold, double size)
    receipt += ESC_POS.TEXT_FORMAT.BOLD_DOUBLE;
    receipt += shopName.toUpperCase();
    receipt += '\n';

    // Cashier name
    receipt += ESC_POS.TEXT_FORMAT.NORMAL;
    if (cashierName) {
      receipt += `Kasir: ${cashierName}\n`;
    }

    // Transaction info
    receipt += `TRX #${trx.id} | ${formatDate(trx.created_at)}\n`;
    receipt += '\n';

    // Shop info
    receipt += ESC_POS.ALIGN.CENTER;
    if (shopPhoneNumber) {
      receipt += `Telp: ${shopPhoneNumber}\n`;
    }
    if (shopAddress) {
      receipt += `${shopAddress}\n`;
    }
    receipt += '\n';

    // Customer info
    receipt += ESC_POS.ALIGN.LEFT;
    receipt += `Pelanggan: ${trx.customer_name || '-'}\n`;
    receipt += `No/ID: ${trx.phone_number}\n`;
    receipt += `Layanan: ${trx.category}\n`;
    receipt += `Produk: ${trx.provider}\n`;
    receipt += '\n';

    // Divider
    receipt += '--------------------------------\n';

    // Total
    receipt += ESC_POS.TEXT_FORMAT.BOLD_DOUBLE;
    receipt += `TOTAL: ${formatCurrency(trx.selling_price)}\n`;
    receipt += ESC_POS.TEXT_FORMAT.NORMAL;
    receipt += '\n';

    // Notes/Token
    if (trx.notes) {
      receipt += ESC_POS.ALIGN.CENTER;
      receipt += 'TOKEN / KETERANGAN:\n';
      receipt += ESC_POS.TEXT_FORMAT.BOLD;
      receipt += `${trx.notes}\n`;
      receipt += ESC_POS.TEXT_FORMAT.NORMAL;
      receipt += '\n';
    }

    // Divider
    receipt += '--------------------------------\n';

    // Footer
    receipt += ESC_POS.ALIGN.CENTER;
    receipt += `${footerNote}\n`;
    receipt += '\n\n';

    // Cut paper
    receipt += ESC_POS.FEED;
    receipt += ESC_POS.CUT;

    // Send to printer
    await BluetoothEscposPrinter.printText(receipt, {});
  } catch (error: any) {
    console.error('Print error:', error);
    throw new Error(`Gagal mencetak: ${error.message}`);
  } finally {
    isPrinting = false;
  }
};

type SaleReceipt = Sale & {
  payment_method_name?: string;
};

export const printSaleReceipt = async (sale: SaleReceipt, items: any[]) => {
  if (isPrinting) {
    console.warn('Print request already in progress');
    throw new Error('Another print request is already in progress');
  }

  isPrinting = true;

  try {
    // Check connection
    if (!connectedDeviceAddress) {
      throw new Error('Printer tidak terhubung. Silakan connect ke printer terlebih dahulu.');
    }

    const profile = await getShopProfile();
    const shopName = profile?.name || 'AMINMART';
    const cashierName = profile?.cashier_name || '';
    const footerNote = profile?.footer_note || 'Terima Kasih Atas Kepercayaan Anda';
    const shopPhoneNumber = profile?.phone_number || '';
    const shopAddress = profile?.address || '';

    // Build receipt content
    let receipt = '';

    // Initialize
    receipt += ESC_POS.INIT;
    receipt += ESC_POS.ALIGN.CENTER;

    // Shop name (bold, double size)
    receipt += ESC_POS.TEXT_FORMAT.BOLD_DOUBLE;
    receipt += shopName.toUpperCase();
    receipt += '\n';

    // Cashier name
    receipt += ESC_POS.TEXT_FORMAT.NORMAL;
    if (cashierName) {
      receipt += `Kasir: ${cashierName}\n`;
    }

    // Transaction info
    receipt += `TRX #${sale.id} | ${formatDate(sale.created_at)}\n`;
    receipt += '\n';

    // Shop info
    receipt += ESC_POS.ALIGN.CENTER;
    if (shopPhoneNumber) {
      receipt += `Telp: ${shopPhoneNumber}\n`;
    }
    if (shopAddress) {
      receipt += `${shopAddress}\n`;
    }
    receipt += '\n';

    // Items
    receipt += ESC_POS.ALIGN.LEFT;
    for (const item of items) {
      receipt += ESC_POS.TEXT_FORMAT.BOLD;
      receipt += `${item.product_name || 'Produk'}\n`;
      receipt += ESC_POS.TEXT_FORMAT.NORMAL;
      receipt += `${item.qty} x ${formatCurrency(item.price)}\n`;
      receipt += ESC_POS.ALIGN.RIGHT;
      receipt += formatCurrency(item.subtotal) + '\n';
      receipt += ESC_POS.ALIGN.LEFT;
    }
    receipt += '\n';

    // Divider
    receipt += '--------------------------------\n';

    // Payment info
    receipt += ESC_POS.ALIGN.LEFT;
    receipt += `Metode: ${sale.payment_method_name || '-'}\n`;
    receipt += `SUBTOTAL: ${formatCurrency(sale.total)}\n`;
    
    // Total
    receipt += ESC_POS.TEXT_FORMAT.BOLD_DOUBLE;
    receipt += `TOTAL: ${formatCurrency(sale.total)}\n`;
    receipt += ESC_POS.TEXT_FORMAT.NORMAL;
    receipt += '\n';

    // Payment
    receipt += `BAYAR: ${formatCurrency(sale.paid)}\n`;
    receipt += `KEMBALI: ${formatCurrency(sale.change)}\n`;
    receipt += '\n';

    // Divider
    receipt += '--------------------------------\n';

    // Footer
    receipt += ESC_POS.ALIGN.CENTER;
    receipt += `${footerNote}\n`;
    receipt += '\n\n';

    // Cut paper
    receipt += ESC_POS.FEED;
    receipt += ESC_POS.CUT;

    // Send to printer
    await BluetoothEscposPrinter.printText(receipt, {});
  } catch (error: any) {
    console.error('Print error:', error);
    throw new Error(`Gagal mencetak: ${error.message}`);
  } finally {
    isPrinting = false;
  }
};
