export interface Product {
  id?: number;             // auto increment
  code: string;            // kode barang
  name: string;            // nama barang
  purchasePrice: number;   // harga beli
  purchaseUnit?: string;   // satuan harga beli
  purchasePackageQty?: number; // kuantitas paket beli
  salePrice: number;       // harga jual
  saleUnit?: string;       // satuan harga jual
  salePackageQty?: number; // kuantitas paket jual
  discount?: number;       // diskon dalam persen (%)
  stock?: number;          // jumlah stok
  createdAt?: string;      // tanggal dibuat
  updatedAt?: string;      // tanggal update terakhir
}
