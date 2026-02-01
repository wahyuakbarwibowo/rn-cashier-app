# 🛒 Aminmart Kasir (Retail & PPOB)

**Aminmart Kasir** adalah aplikasi Point of Sales (POS) berbasis **React Native** & **Expo** yang intuitif, cepat, dan modern. Dirancang khusus untuk memenuhi kebutuhan toko retail, minimarket, serta agen pulsa & PPOB dalam satu platform yang terintegrasi.

---

## ✨ Fitur Utama

### 🏦 Manajemen Retail (Fisik)
*   **Transaksi Kasir Cepat**: Input barang via nama atau **Scan Barcode** kamera.
*   **Stok Barang Real-time**: Monitoring stok otomatis berkurang saat terjual.
*   **Manajemen Supplier & Pembelian**: Catat pembelian stok dan kelola data supplier.
*   **Hutang & Piutang**: Lacak piutang pelanggan dan hutang ke supplier dengan jatuh tempo.

### 📱 Layanan Digital (PPOB)
*   **Multi-Kategori**: Mendukung Pulsa, Paket Data, Token PLN, PDAM, Transfer Bank, E-Wallet, hingga Game Online.
*   **Master Produk Digital**: Kelola template harga modal dan harga jual untuk transaksi yang lebih cepat.
*   **Input User-Friendly**: Pilih nomor tujuan dari riwayat transaksi sebelumnya untuk kecepatan.
*   **Cetak Struk Profesional**: Kirim struk digital (PDF) atau cetak langsung ke **Printer Thermal Bluetooth** (58mm/80mm).

### 📊 Laporan & Analisis
*   **Laporan Laba/Rugi Real-time**: Lihat keuntungan bersih hari ini, bulan ini, atau tahun ini.
*   **Grafik Penjualan**: Visualisasi tren penjualan harian.
*   **Laporan Khusus Digital**: Analisis profit terpisah untuk layanan PPOB.

---

## 🛠️ Teknologi yang Digunakan

*   **Format**: React Native (Expo SDK 54)
*   **Penyimpanan**: SQLite (Internal Offline Database)
*   **Bahasa**: TypeScript
*   **Navigasi**: React Navigation (Drawer & Stack)
*   **Cetak**: Expo Print (HTML to PDF/Thermal)

---

## 🚀 Cara Menjalankan

1.  **Clone Repository**:
    ```bash
    git clone https://github.com/wahyuakbarwibowo/rn-cashier-app.git
    cd rn-cashier-app
    ```

2.  **Instal Dependensi**:
    ```bash
    bun install # atau npm install
    ```

3.  **Jalankan Aplikasi**:
    ```bash
    bun start # atau npx expo start
    ```

4.  **Testing di HP**:
    Scan QR Code menggunakan aplikasi **Expo Go** (Android/iOS).

---

## 🖨️ Panduan Cetak Struk (Printer Bluetooth)

Untuk mencetak langsung ke printer thermal dari aplikasi ini:
1.  Siapkan printer thermal Bluetooth Anda.
2.  Instal aplikasi jembatan di Android (seperti **RawBT** atau **ESC/POS Bluetooth Print Service**).
3.  Sambungkan printer Anda ke aplikasi tersebut.
4.  Klik **Cetak Struk** di Aminmart Kasir dan pilih driver printer yang sesuai.

---

## ✍️ Kontribusi

Aplikasi ini bersifat open-source. Kritik dan saran sangat kami harapkan untuk pengembangan yang lebih baik.

**Dibuat dengan ❤️ oleh Wahyu Akbar Wibowo**
