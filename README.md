# 🛒 Aminmart Cashier (Retail & PPOB)

**Aminmart Cashier** adalah aplikasi Point of Sales (POS) berbasis **React Native** & **Expo** yang intuitif, cepat, dan modern. Dirancang khusus untuk memenuhi kebutuhan toko retail, minimarket, serta agen pulsa & PPOB dalam satu platform yang terintegrasi.

---

### ✨ Fitur Utama
*   **Retail POS**: Manajemen stok barang, barcode scanner (via kamera), transaksi kasir kilat.
*   **PPOB & Layanan Digital**: Transaksi Pulsa, PLN, E-Wallet, BPJS, Transfer Bank, dan Game.
*   **📉 Laporan Laba Rugi (Profit & Loss)**: Analisis keuntungan bersih yang sudah terintegrasi dengan omset penjualan, HPP, pengeluaran, serta pantauan saldo **Hutang & Piutang**.
*   **🤝 Manajemen Hutang & Piutang**: Lacak piutang pelanggan dan hutang ke supplier secara mendetail dengan sistem jatuh tempo dan fitur **Tagih via WhatsApp**.
*   **💸 Manajemen Pengeluaran**: Pencatatan biaya operasional harian (listrik, sewa, gaji) untuk perhitungan laba bersih yang akurat.
*   **✅ Validasi Stok Pintar**: Sistem otomatis mencegah transaksi jika stok barang tidak mencukupi, lengkap dengan peringatan visual di keranjang.
*   **📦 Kalkulasi Otomatis**: Input harga paket/dus dan isi, sistem otomatis menghitung harga modal & jual satuan di manajemen produk.
*   **⚠️ Sistem Alert Stok Rendah**: Notifikasi visual dan daftar khusus untuk produk yang stoknya di bawah ambang batas (Critical Stock).
*   **🌸 Premium UI & Interaktif**: Desain modern yang interaktif; klik item laporan untuk melihat detail transaksi atau produk secara instan.
*   **📅 Format Tanggal Standar**: Format waktu Indonesia yang mudah dibaca (12 Februari 2026, 21:00) di seluruh riwayat.
*   **Manajemen Kategori Dinamis**: Tambah, edit, dan hapus kategori produk digital sesuka hati (PULSA, PDAM, VOUCHER, dll).
*   **Optimasi Struk Thermal**: Cetak struk 58mm yang rapi untuk semua jenis transaksi (Retail & Digital).
*   **📜 Riwayat Transaksi Digital**: Navigasi khusus untuk melihat detail transaksi digital masa lalu.
*   **📅 Filter Rentang Tanggal**: Filter laporan dan riwayat berdasarkan periode waktu tertentu (Hari, Minggu, Bulan, Tahun).
*   **💾 Backup & Restore**: Amankan data lokal Anda dengan fitur ekspor/impor database.

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
*   `phone_history`: Log transaksi digital.
*   `receivables`: Data piutang pelanggan.
*   `payables`: Data hutang ke supplier.
*   `expenses`: Data pengeluaran operasional.

---

Developed with ❤️ by **Wahyu Akbar Wibowo**
