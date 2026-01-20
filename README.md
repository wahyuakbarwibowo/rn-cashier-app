# 📦 Cashier Apps (React Native + Expo + SQLite)

Aplikasi kasir (Point of Sale) profesional berbasis **React Native (Expo)** yang dirancang untuk bekerja sepenuhnya **offline** menggunakan **SQLite**. Cocok untuk UMKM, toko kelontong, atau usaha jasa.

## 🚀 Fitur Utama

### 1. 🏠 Dashboard Pintar
- Ringkasan penjualan harian secara real-time.
- Notifikasi otomatis untuk stok barang yang menipis (< 10).
- Statistik jumlah pelanggan dan akses cepat ke fitur utama via Grid Menu.

### 2. 🛒 Manajemen Transaksi & Kasir
- **Kasir Cepat**: Keranjang belanja dengan dukungan harga Satuan vs Paket.
- **Dukungan Barcode**: Scan kode barang menggunakan kamera HP.
- **Multi-Pelanggan**: Pilih pelanggan saat transaksi atau gunakan "Umum".
- **Metode Pembayaran**: Dukungan Tunai, Kartu Debit, E-Wallet, dan QRIS.
- **Piutang Otomatis**: Jika pembayaran kurang, sisa tagihan otomatis tercatat sebagai piutang pelanggan.

### 3. 📱 Transaksi Pulsa & Paket Data
- Input nomor HP dengan **Riwayat Nomor** (nomor yang sering dipakai muncul otomatis).
- Pencatatan harga modal vs harga jual untuk perhitungan laba bersih pulsa.

### 4. 📦 Inventori & Stok (Advanced)
- **Satuan & Paket**: Mendukung konversi stok otomatis (misal: beli 1 dus isi 12 pcs).
- **Pembelian (Stock In)**: Alur pembelian stok dari supplier dengan pencatatan hutang otomatis jika belum lunas.
- **Diskon**: Fitur diskon per produk.

### 5. 💰 Manajemen Keuangan & Hutang
- **Piutang Pelanggan**: Pantau siapa saja yang belum lunas dan tandai sebagai lunas.
- **Hutang Supplier**: Pantau tagihan barang masuk ke supplier.

### 6. 📊 Laporan Lengkap (Filter Harian/Bulanan/Tahunan)
- Laporan Penjualan (Omzet).
- Laporan Stok (Aset).
- Laporan Laba Bersih (Profit).
- Laporan Pembelian Barang.

### 7. 💾 Backup & Restore (Offline Data Portability)
- **Ekspor JSON**: Backup seluruh data aplikasi ke dalam file `.json`.
- **Berbagi Data**: Kirim file backup via WhatsApp, Email, atau Drive.
- **Restore Data**: Pindahkan data ke HP baru hanya dengan mengimpor file backup.

## 🛠️ Stack Teknologi
- **Core**: React Native & Expo SDK 54.
- **Language**: TypeScript.
- **Database**: `expo-sqlite` (Local, High Performance).
- **Navigation**: React Navigation (Drawer & Stack).
- **Utilities**: `expo-camera`, `expo-sharing`, `expo-file-system`, `expo-document-picker`.

## 📂 Struktur Folder
```text
src/
 ├── database/
 │    ├── initDB.ts        # Inisialisasi & Proteksi Race Condition
 │    ├── products.ts      # Logika database Produk
 │    ├── sales.ts         # Logika Transaksi & Stok
 │    ├── backup.ts        # Koding Ekspor/Impor JSON
 │    └── ...              # Modul DB lainnya
 ├── screens/
 │    ├── DashboardScreen.tsx   # Hub Utama
 │    ├── SalesTransaction.tsx # UI Kasir
 │    ├── ReportsScreen.tsx    # Statistik & Grafik
 │    └── ...                  # Layar fitur lainnya
 ├── types/
 │    └── database.ts      # Definisi Interface Data
 └── navigation/
      ├── DrawerNavigator.tsx # Konfigurasi Menu
      └── types.ts            # Tipe Navigasi
```

## ⚡ Instalasi
Aplikasi ini menggunakan `bun` untuk manajemen package tercepat:

1. **Clone & Install**
   ```bash
   git clone https://github.com/wahyuakbarwibowo/rn-cashier-app
   cd rn-cashier-app
   bun install
   ```

2. **Jalankan Project**
   ```bash
   bun start
   ```

3. **Running di HP**
   - Install **Expo Go** di Android/iOS.
   - Scan QR Code yang muncul di terminal.

## 📌 Catatan Pengembangan
- **Stabilitas Database**: Menggunakan sistem *Promise Locking* di `initDB.ts` untuk mencegah `NullPointerException` di Android.
- **UI/UX**: Mengadaptasi *Glassmorphism* ringan dan *Premium Dark/Light* elemen.

---
*Dikembangkan dengan ❤️ untuk kemajuan UMKM Digital.*
