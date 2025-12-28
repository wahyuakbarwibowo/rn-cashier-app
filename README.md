# 📦 Aplikasi Kasir (React Native + Expo + TypeScript + SQLite)

Aplikasi kasir sederhana berbasis **React Native (Expo)** menggunakan **SQLite** untuk penyimpanan data offline.  
Dibangun dengan **TypeScript** supaya lebih aman dan mudah dikembangkan.  

## 🚀 Fitur (Roadmap)
- **Produk / Barang**
  - Tambah, Edit, Hapus produk
  - Stok, harga beli, harga jual, diskon, paket
- **Transaksi**
  - Penjualan (keranjang belanja, pengurangan stok)
  - Pembelian (stok masuk)
- **Laporan**
  - Penjualan harian, mingguan, bulanan, tahunan
  - Laba, piutang, stok
- **Pengaturan**
  - Profil toko (nama, catatan kaki struk)
  - Metode pembayaran (Tunai, Kartu, E-Wallet, QRIS)

## 🛠️ Teknologi
- Expo (React Native framework)
- TypeScript
- expo-sqlite (database lokal)

## 📂 Struktur Project
src/  
 ├── database/  
 │    ├── initDB.ts        # Inisialisasi database SQLite  
 │    ├── products.ts      # CRUD produk  
 ├── screens/  
 │    ├── ProductsScreen.tsx  # UI atur produk  
 ├── types/  
 │    ├── database.ts      # Tipe data TypeScript  
App.tsx                    # Entry point aplikasi  

## ⚡ Instalasi
1. Buat project baru dengan Expo  
   npx create-expo-app kasir-app  
   cd kasir-app  

2. Install dependency  
   npx expo install expo-sqlite  
   npm install --save-dev typescript @types/react @types/react-native  

3. Tambahkan folder `src/` dan isi dengan kode:  
   - src/database/initDB.ts  
   - src/database/products.ts  
   - src/types/database.ts  
   - src/screens/ProductsScreen.tsx  

4. Update App.tsx agar menggunakan ProductsScreen.  

5. Jalankan project  
   npx expo start  

## 📱 Menjalankan di Perangkat Asli
1. Install aplikasi Expo Go di Android / iOS.  
2. Jalankan:  
   npx expo start  
3. Scan QR Code dari terminal / browser dengan kamera HP.  
4. Aplikasi langsung running di device! 🎉  

## 🗄️ Database
Database default: kasir.db (tersimpan di device).  
Tabel utama:  
- products  
- customers  
- payment_methods  
- sales  
- sales_items  
- shop_profile  

## ✅ Status
- [x] Init database  
- [x] CRUD Produk  
- [ ] Transaksi Penjualan  
- [ ] Laporan  
- [ ] Modul Lain (sesuai roadmap)  

## 📌 Catatan
- Saat ini masih berbasis Expo Managed Workflow.  
- Kalau nanti butuh Bluetooth Printer atau integrasi hardware, kemungkinan harus eject ke Bare Workflow.  
