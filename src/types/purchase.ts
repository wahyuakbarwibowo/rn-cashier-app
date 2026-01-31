export interface Purchase {
  id?: number;
  date: string;
  supplier_id?: number;
  supplier?: string;
  total: number;
}

export interface PurchaseItem {
  id?: number;
  purchaseId: number;
  productId: number;
  qty: number;
  price: number;       // harga beli per item
}
