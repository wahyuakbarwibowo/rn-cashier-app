# 🛒 Aminmart Cashier (Retail & PPOB)

**Aminmart Cashier** adalah aplikasi Point of Sales (POS) berbasis **React Native** & **Expo** yang intuitif, cepat, dan modern. Dirancang khusus untuk memenuhi kebutuhan toko retail, minimarket, serta agen pulsa & PPOB dalam satu platform yang terintegrasi.

---

### ✨ Fitur Utama
*   **Retail POS**: Manajemen stok barang, barcode scanner (via kamera), transaksi kasir kilat.
*   **PPOB & Layanan Digital**: Transaksi Pulsa, PLN, E-Wallet, BPJS, Transfer Bank, dan Game.
*   **Manajemen Kategori Dinamis**: Tambah, edit, dan hapus kategori produk digital sesuka hati (PULSA, PDAM, VOUCHER, dll).
*   **Optimasi Struk Thermal**: Cetak struk 58mm yang rapi untuk semua jenis transaksi (Retail & Digital).
*   **Laporan Laba/Rugi**: Pantau keuntungan harian, bulanan, dan tahunan secara otomatis.
*   **Offline First**: Data disimpan lokal menggunakan SQLite, aman dan kencang tanpa internet.
*   **Manajemen Pelanggan & Supplier**: Kelola database kontak bisnis Anda dengan mudah.

---

## 🛠️ Tech Stack
*   **Framework**: React Native (Expo SDK 52)
*   **Database**: SQLite via `expo-sqlite` (Offline)
*   **Navigation**: React Navigation (Drawer & Stack)
*   **Printing**: `expo-print` (Formatted for 58mm Thermal Bluetooth Printer)
*   **UI Components**: React Native Paper & Custom Design Systems

---

## 🚀 Cara Menjalankan Project

1.  **Clone Repository**
    ```bash
    git clone https://github.com/wahyuakbarwibowo/rn-cashier-app.git
    cd rn-cashier-app
    ```

2.  **Install Dependencies**
    ```bash
    bun install
    # atau menggunakan npm
    npm install
    ```

3.  **Jalankan Aplikasi**
    ```bash
    bun start
    ```
    Gunakan aplikasi **Expo Go** di Android/iOS untuk men-scan QR code yang muncul.

---

## 🖨️ Panduan Cetak Struk (Thermal Printer)
Aplikasi ini dioptimalkan untuk kertas thermal ukuran **58mm**.
1.  Pastikan Printer Bluetooth sudah terhubung dengan perangkat Android/iOS Anda.
2.  Setelah transaksi berhasil, klik tombol **"Cetak Struk"**.
3.  Pilih Printer Bluetooth yang sesuai pada dialog sistem printing.
4.  Teks dan layout akan otomatis menyesuaikan lebar kertas thermal.

---

## 📂 Struktur Database (Digital Services)
Sistem digital menggunakan tabel dinamis:
*   `digital_categories`: Menyimpan daftar kategori (PULSA, PLN, dll).
*   `digital_product_master`: Template produk per kategori & provider.
*   `digital_transactions`: Log transaksi digital.

---

Developed with ❤️ by **Wahyu Akbar Wibowo**
