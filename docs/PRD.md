# PRD — Warung Sembako POS

- **Dokumen:** Product Requirements Document
- **Status:** SOT v1.0 — frontend-first
- **Produk:** Warung Sembako POS + storefront
- **Bahasa UI:** Bahasa Indonesia
- **Zona waktu awal:** Asia/Jakarta
- **Mata uang:** IDR (Rupiah)
- **Sumber kebenaran:** Dokumen dalam `docs/`. Jika ada konflik, prioritaskan PRD untuk scope, USER-FLOW untuk perilaku, UI-GUIDELINE untuk visual, dan API-SPEC untuk kontrak integrasi.

## 1. Ringkasan produk

Warung Sembako POS adalah aplikasi web responsif untuk mengelola penjualan toko sembako dan toko online dalam satu pengalaman. Tahap pertama berfokus pada **frontend yang dapat divalidasi pengguna**, menggunakan data mock lokal dan adapter API yang dapat diganti tanpa menulis ulang UI. Backend, database, autentikasi produksi, pembayaran, dan kurir nyata tidak dibuat pada tahap validasi frontend.

Produk memiliki empat role: **Owner, Admin, Staff/Kasir, Customer**. Sistem mendukung tiga tier harga — Eceran, Grosir 1, Grosir 2 — dengan aturan yang menggabungkan tier pelanggan dan kuantitas pembelian.

## 2. Tujuan

1. Memvalidasi struktur navigasi, visual, dan alur kerja utama sebelum investasi backend.
2. Membuat POS yang cepat dipakai kasir desktop/tablet.
3. Menampilkan dashboard Owner yang membantu memantau penjualan, stok, dan piutang.
4. Menyediakan storefront yang memudahkan pelanggan melihat produk dan membuat pesanan.
5. Menjaga frontend tetap decoupled dari backend melalui kontrak API dan repository/adapter.
6. Menghindari fitur berlebihan yang belum dibutuhkan satu toko dan satu gudang.

## 3. Bukan tujuan tahap frontend

- Membuat database atau migration produksi.
- Membuat autentikasi/otorisasi produksi.
- Mengintegrasikan payment gateway, QRIS dinamis, kurir, WhatsApp, atau printer secara nyata.
- Membuat multi-cabang, multi-gudang, akuntansi penuh, loyalty, marketplace, atau aplikasi mobile native.
- Mengklaim pembayaran, stok, atau transaksi mock sebagai transaksi sungguhan.

## 4. Pengguna dan kebutuhan

### Owner
- Memahami ringkasan omzet, transaksi, laba kotor estimasi, stok menipis, dan piutang.
- Meninjau laporan berdasarkan rentang tanggal.
- Memantau aktivitas penting dan hasil kerja kasir.
- Tidak harus melakukan transaksi harian.

### Admin
- Mengelola produk, kategori, satuan, harga, tier pelanggan, dan stok.
- Meninjau pesanan online dan mengelola status operasional.
- Mengelola pengguna serta menyetujui tier grosir/piutang dalam desain UI.
- Aksi sensitif harus tampak jelas dan memerlukan konfirmasi.

### Staff/Kasir
- Membuat transaksi POS secepat mungkin.
- Mencari produk melalui nama/SKU/barcode (barcode scanner diperlakukan seperti input keyboard).
- Memilih pelanggan, melihat tier harga, menerima pembayaran, dan menampilkan/cetak preview struk.
- Mengelola shift kasir dalam bentuk UI mock.

### Customer
- Menjelajahi produk dan harga yang diizinkan.
- Memilih produk, kuantitas, alamat, dan metode pengiriman.
- Melihat status serta riwayat pesanan mock.
- Melihat tier dan harga grosir khusus hanya jika tier sudah disetujui pada data demo.

## 5. Prinsip produk

- **Frontend-first:** seluruh alur inti dapat dicoba tanpa backend.
- **API-ready:** komponen tidak memanggil fetch langsung; semua akses data melewati service/repository layer.
- **Satu toko, satu gudang:** jangan membangun abstraksi multi-cabang.
- **Jelas dan cepat:** POS adalah alat kerja, bukan landing page marketing.
- **Tidak mengarang status nyata:** beri label “Mode demo” atau “Data contoh” pada data mock.
- **Akses berdasarkan role:** UI menyembunyikan menu yang tidak relevan, tetapi dokumentasikan bahwa otorisasi sebenarnya wajib di backend.
- **Tidak ada over-engineering:** gunakan satu aplikasi Vite dengan route per area, bukan microfrontend atau banyak service.

## 6. Ruang lingkup frontend

### P0 — wajib untuk validasi
1. Landing/storefront: header, pencarian, kategori, produk pilihan, cara belanja, CTA.
2. Login/demo role switcher yang jelas diberi label demo; jangan menyebutnya autentikasi aman.
3. Dashboard Owner: kartu ringkasan, grafik sederhana atau visual ringkas, transaksi terbaru, stok menipis, piutang.
4. Dashboard Admin: ringkasan operasional, produk, kategori, harga, stok, daftar pesanan.
5. POS Kasir: pencarian/scan input, keranjang, kuantitas, tier harga, subtotal, diskon terbatas, metode pembayaran mock, hasil transaksi dan struk preview.
6. Produk: daftar, pencarian, filter kategori/status, tambah/edit via modal atau halaman, validasi form.
7. Harga bertingkat: tier Eceran/Grosir 1/Grosir 2 dengan aturan kuantitas per produk.
8. Persediaan: stok saat ini, stok minimum, status menipis, penyesuaian stok mock dengan alasan.
9. Storefront checkout: keranjang, alamat, metode pengiriman, estimasi ongkir mock, pilihan transfer manual/gateway demo, ringkasan dan konfirmasi.
10. Pesanan: daftar, detail, status, tracking number mock.
11. Piutang: daftar pelanggan, sisa tagihan, jatuh tempo, catatan pembayaran mock.
12. Responsif, loading/empty/error state, toast, konfirmasi aksi destruktif.
13. Data mock terpusat dan tests untuk fungsi harga/total.

### P1 — jika P0 sudah tervalidasi
- Riwayat transaksi dan filter lebih lengkap.
- Tutup shift kasir dan rekonsiliasi kas.
- Retur sederhana dengan otorisasi UI.
- Ekspor CSV untuk laporan.
- Cetak struk browser melalui print stylesheet untuk ukuran 58 mm/80 mm; hardware tetap harus dites terpisah.

### Tidak masuk versi awal
- Multi-gudang/cabang, multi-tenant.
- Akuntansi double-entry lengkap.
- Forecasting AI, rekomendasi AI, chatbot.
- Loyalty points, kupon kompleks, subscription.
- Integrasi live kurir/payment sebelum backend dan kredensial tersedia.
- Offline POS dengan sinkronisasi konflik.
- Builder permission granular per aksi.
- Real-time multi-user tanpa kebutuhan teruji.

## 7. Aturan bisnis utama

### Harga
- Tiers: `RETAIL` (Eceran), `WHOLESALE_1` (Grosir 1), `WHOLESALE_2` (Grosir 2).
- Setiap produk memiliki aturan harga per tier dengan `minQuantity`.
- Harga dipilih berdasarkan tier pelanggan dan kuantitas agregat per produk/satuan pada keranjang.
- Pilih aturan dengan `minQuantity` tertinggi yang <= kuantitas.
- Jika tier atau aturan tidak tersedia, gunakan aturan fallback yang eksplisit (default: tier Eceran); jangan diam-diam memberikan harga lebih murah.
- Untuk customer yang belum login/terverifikasi, gunakan Eceran.
- Pada frontend demo, harga hanya simulasi. Backend nanti wajib menghitung ulang harga pada checkout.

### Stok
- `onHand`: jumlah fisik.
- `reserved`: stok yang ditahan untuk pesanan online belum final.
- `available = onHand - reserved`.
- Frontend demo boleh memperbarui mock state; jangan menganggapnya konsisten lintas perangkat.
- Penyesuaian stok wajib memiliki alasan.

### Penjualan dan pembayaran
- Saluran: `POS` dan `ONLINE`.
- Metode pembayaran UI: tunai, transfer manual, QRIS/payment gateway (demo), COD jika toko mengaktifkannya.
- Status pembayaran dan status pesanan terpisah.
- Piutang hanya untuk pelanggan yang disetujui, dengan batas kredit mock.
- Jangan mencatat pembayaran cicilan sebagai penjualan baru.

### Pengiriman
- Metode: kurir toko dan kurir eksternal.
- Tahap frontend menggunakan ongkir/nomor resi contoh dan selalu memberi label demo.
- Tracking aktual hanya setelah API kurir diintegrasikan.

## 8. Navigasi dan halaman minimum

- `/` — storefront landing
- `/produk` — katalog
- `/produk/:slug` — detail produk
- `/keranjang`
- `/checkout`
- `/akun/pesanan`
- `/login`
- `/app` — redirect sesuai role demo
- `/app/owner`
- `/app/admin`
- `/app/kasir`
- `/app/produk`
- `/app/harga`
- `/app/persediaan`
- `/app/pesanan`
- `/app/piutang`
- `/app/laporan`
- `/app/pengaturan`

Jika implementasi route library dipilih, gunakan React Router. Jangan membuat semua halaman dalam satu komponen besar.

## 9. Metrik validasi frontend

- Pengguna dapat menemukan produk dan menambahkan ke keranjang tanpa bantuan.
- Kasir dapat menyelesaikan skenario demo penjualan dalam 60–90 detik.
- Pengguna dapat membedakan tier harga dengan jelas.
- Owner memahami indikator utama dalam 10 detik pertama.
- Tidak ada overflow horizontal pada lebar 360 px.
- Semua aksi utama memiliki feedback; tidak ada tombol dekoratif yang tampak aktif tetapi tidak bekerja.
- Unit test harga dan total lulus.

## 10. Kriteria selesai tahap frontend

- Seluruh P0 tersedia menggunakan mock data.
- Empat role demo mempunyai navigasi dan aksi yang sesuai.
- Tema sage, magenta, dan hitam diterapkan konsisten.
- Tampilan loading, empty, error, success, dan confirmation tersedia untuk alur penting.
- Semua data mock berada di layer data, bukan hardcoded tersebar di komponen.
- `npm run build` dan tests berhasil di lingkungan pengembang.
- README menjelaskan bahwa integrasi backend belum aktif.
- Tidak ada secret API atau kredensial produksi di frontend.
