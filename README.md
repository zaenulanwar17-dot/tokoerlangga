# Warung Sembako POS — Frontend Prototype (SOT v1.0)

Aplikasi web modern **Warung Sembako POS & Toko Online** yang dibangun dengan pendekatan *frontend-first* untuk validasi alur kerja, visual, navigasi, dan logika bisnis harga bertingkat sebelum investasi pembuatan backend dan database.

---

## 🚀 Fitur yang Telah Diimplementasikan (P0 SOT)

### 1. Storefront & Toko Online Pelanggan
- **Beranda (`/`)**: Hero banner, ringkasan keunggulan, kategori sembako, dan daftar produk pilihan bertingkat.
- **Katalog Lengkap (`/produk`)**: Pencarian produk via nama, SKU, dan barcode; filter kategori; serta filter ketersediaan stok.
- **Detail Produk (`/produk/:id`)**: Informasi detail barang, status stok, tabel aturan harga bertingkat lengkap (Eceran, Grosir 1, Grosir 2), dan kalkulator harga *real-time* saat kuantitas diubah.
- **Keranjang Belanja (`/keranjang`)**: Pengaturan jumlah pesanan (+/-), penghitungan ulang tier otomatis berdasarkan profil pelanggan, dan kalkulasi subtotal.
- **Checkout Pesanan (`/checkout`)**: Formulir data penerima, pilihan pengiriman (Kurir Toko Express, Ekspedisi SiCepat Demo, Ambil Sendiri), opsi pembayaran simulasi (Transfer Bank, QRIS Demo, COD), serta ringkasan tagihan transparan.
- **Riwayat Pesanan Saya (`/akun/pesanan`)**: Daftar pesanan online, timeline status, dan simulasi nomor resi pengiriman kurir demo.

### 2. Mesin Kasir Cepat / POS Kasir (`/app/kasir`)
- **Pencarian Cepat Barcode & SKU**: Input otomatis siap fokus untuk barcode scanner fisik (berperilaku seperti keyboard).
- **Pemilih Pelanggan & Tier Otomatis**: Mendukung pelanggan umum (*Walk-in*) serta pelanggan langganan grosir (misal: *Ibu Siti - Grosir 1*, *Pak Joko - Grosir 2*).
- **Kalkulasi Diskon & Kembalian**: Menghitung subtotal, diskon kasir terbatas, uang diterima tunai, dan kembalian secara presisi.
- **Modal Pembayaran & Cetak Struk**: Dialog pembayaran Tunai/Non-tunai, preview struk belanja, dan dukungan cetak browser (*print stylesheet* untuk printer thermal 58 mm / 80 mm).

### 3. Manajemen Produk & Editor Harga Bertingkat
- **Katalog Master Produk (`/app/produk`)**: Daftar barang sembako, filter kategori, tambah produk baru dengan modal HPP dan batas stok minimum, edit produk, serta penonaktifan produk aman (*safe deactivate*).
- **Editor Harga Bertingkat (`/app/harga`)**: Pengaturan aturan batas kuantitas (*minQuantity*) dan harga satuan per tier (Eceran, Grosir 1, Grosir 2) dengan validasi anti-duplikasi aturan.

### 4. Persediaan & Audit Pergerakan Stok (`/app/persediaan`)
- **Stok Fisik & Tersedia**: Pemantauan 3 indikator stok — *On Hand* (stok fisik), *Reserved* (tertahan pesanan online), dan *Available* (*On Hand* - *Reserved*).
- **Penyesuaian Stok Terverifikasi**: Modal perubahan kuantitas (+/-) yang mewajibkan input alasan (misal: penerimaan supplier, barang rusak/pecah, selisih opname fisik).
- **Audit Trail Pergerakan**: Tabel riwayat pencatatan setiap perubahan stok beserta waktu dan nama petugas.

### 5. Manajemen Pesanan & Pengiriman (`/app/pesanan`)
- Tabulasi pesanan gabungan kasir POS dan Online.
- Filter berdasarkan saluran (*Channel*) dan status pesanan.
- Alur transisi status: *Pending Payment* → *Confirmed* → *Processing* → *Ready to Ship* → *Shipped* (dengan input nomor resi & kurir demo) → *Completed*.

### 6. Buku Piutang & Kredit Pelanggan (`/app/piutang`)
- Monitoring sisa tagihan piutang pelanggan grosir dan batas tanggal jatuh tempo.
- Modal pencatatan pembayaran cicilan / pelunasan piutang dengan validasi saldo tanpa menambah omzet penjualan baru.

### 7. Dashboard & Laporan Bisnis Owner (`/app/owner` & `/app/laporan`)
- **4 KPI Bisnis Utama**: Omzet Penjualan, Total Transaksi, Estimasi Laba Kotor (*Omzet - HPP Modal*), dan Total Piutang Belum Lunas.
- Filter periode rentang tanggal (Hari ini, 7 hari terakhir, bulan ini, semua waktu).
- Analisis perbandingan saluran (*POS vs Online*), panel peringatan stok menipis, dan piutang jatuh tempo.
- **Ekspor CSV**: Simulasi unduh data laporan transaksi dan laba kotor.

### 8. Pengaturan Toko & Shift Kasir (`/app/pengaturan`)
- Buka dan tutup shift kasir dengan rekonsiliasi uang fisik laci kasir vs sistem.
- Profil toko dan pesan kaki struk.
- Tombol **Reset Data Demo** kapan saja untuk mengembalikan data ke kondisi awal SOT.

---

## 🛠️ Stack Teknologi

- **Framework**: React 18 + Vite + TypeScript (Strict Mode).
- **Styling**: Tailwind CSS dengan token desain terstandarisasi (`UI-GUIDELINE.md`: Sage, Magenta, Ink, Canvas).
- **Icons**: Lucide React.
- **Routing**: React Router v6.
- **Arsitektur Data**: *Decoupled* — semua akses data melewati interface repository di `src/services/contracts/` dan diimplementasikan via `MockStore` dengan persistensi *localStorage*.
- **Unit Testing**: Vitest (14 unit tests untuk harga, tier, kuantitas, stok tersedia, kembalian, dan piutang).

---

## 💻 Panduan Instalasi & Menjalankan

1. **Instalasi Dependensi**:
   ```powershell
   npm install
   ```

2. **Menjalankan Server Pengembangan**:
   ```powershell
   npm run dev
   ```
   Aplikasi akan terbuka pada: `http://localhost:5173/`

3. **Menjalankan Unit Test Bisnis Logic**:
   ```powershell
   npm test
   ```

4. **Pemeriksaan Tipe TypeScript**:
   ```powershell
   npm run typecheck
   ```

5. **Build Produksi**:
   ```powershell
   npm run build
   ```

---

## 🔒 Batasan Prototipe Mode Demo

- Tidak ada kredensial atau secret produksi di frontend bundle.
- Semua data tersimpan di memori peramban (*localStorage*).
- Status pembayaran, resi pengiriman, dan WhatsApp adalah simulasi interaktif tanpa ketergantungan API pihak ketiga.
- Tahap backend (database SQL, otentikasi JWT/Supabase, payment gateway nyata, dan kurir live) **belum dibuat** dan menunggu validasi serta persetujuan penuh dari Product Owner.
