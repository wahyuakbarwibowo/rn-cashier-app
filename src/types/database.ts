// Produk / Barang
export interface Product {
  id?: number;
  code?: string;
  name: string;
  purchase_price?: number;
  selling_price?: number;
  package_price?: number;
  package_qty?: number;
  discount?: number;
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

// Pelanggan
export interface Customer {
  id?: number;
  name: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

// Metode Pembayaran
export interface PaymentMethod {
  id?: number;
  name: string;
}

// Profil Toko
export interface ShopProfile {
  id?: number;
  name: string;
  footer_note?: string;
}

// Transaksi Penjualan
export interface Sale {
  id?: number;
  customer_id?: number;
  payment_method_id?: number;
  total: number;
  paid: number;
  change: number;
  created_at?: string;
}

// Item Penjualan
export interface SaleItem {
  id?: number;
  sale_id: number;
  product_id: number;
  qty: number;
  price: number;
  subtotal: number;
}
