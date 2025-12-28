export interface Purchase {
  id?: number;
  date: string;        // tanggal pembelian
  supplier?: string;   // opsional
  total: number;
}

export interface PurchaseItem {
  id?: number;
  purchaseId: number;
  productId: number;
  qty: number;
  price: number;       // harga beli per item
}
