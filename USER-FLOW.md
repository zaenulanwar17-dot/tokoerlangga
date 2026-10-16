# User Flow — Warung Sembako POS

- **Status:** SOT v1.0 — frontend-first
- **Tujuan:** Menetapkan alur yang perlu divisualisasikan dan divalidasi sebelum backend dibuat.

## 1. Peta alur tingkat tinggi

```text
Pengunjung
  ├── Jelajahi katalog → Detail produk → Keranjang → Checkout → Pesanan demo
  └── Login demo → Area sesuai role
        ├── Owner → Dashboard → Laporan / Stok menipis / Piutang
        ├── Admin → Produk / Harga / Persediaan / Pesanan / Pelanggan
        ├── Staff/Kasir → POS → Pilih pelanggan → Tambah produk → Bayar → Struk
        └── Customer → Katalog / Keranjang / Checkout / Riwayat pesanan
```

## 2. Entry point dan role demo

1. Pengguna membuka `/`.
2. Landing page menampilkan CTA “Belanja sekarang” dan “Masuk”.
3. Tombol “Demo aplikasi” membuka halaman pemilih role.
4. Pengguna memilih Owner, Admin, Staff/Kasir, atau Customer.
5. Aplikasi menampilkan banner `MODE DEMO — data tidak tersimpan ke server`.
6. Redirect menuju dashboard sesuai role.

**Validasi:** role switcher hanya untuk preview lokal; jangan tampilkan sebagai sistem login produksi.

## 3. Flow Owner

1. Masuk melalui role demo Owner.
2. Melihat kartu omzet, jumlah transaksi, laba kotor estimasi, piutang, dan stok menipis.
3. Memilih rentang tanggal.
4. Melihat daftar transaksi terbaru.
5. Memilih indikator stok menipis untuk menuju daftar persediaan.
6. Memilih piutang untuk membuka ringkasan piutang dan umur tagihan.
7. Melihat laporan per channel POS/ONLINE.
8. Jika memilih aksi administratif, tampilkan penjelasan bahwa aksi tersebut dibatasi sesuai kebijakan role.

**States:** loading skeleton, data tersedia, data kosong, error mock, rentang tanggal invalid.

## 4. Flow Admin — produk dan harga

1. Buka menu Produk.
2. Cari berdasarkan nama, SKU, atau barcode.
3. Filter berdasarkan kategori/status stok.
4. Klik “Tambah produk”.
5. Isi nama, SKU, kategori, satuan, HPP, stok minimum, dan harga awal.
6. Isi aturan harga untuk Eceran, Grosir 1, Grosir 2.
7. Untuk setiap tier, tambahkan satu atau lebih batas kuantitas.
8. Validasi: nama/SKU wajib; harga tidak negatif; min quantity >= 1; aturan tier tidak boleh tumpang tindih.
9. Simpan demo.
10. Tampilkan toast berhasil dan produk muncul di tabel.

**Flow edit:** buka detail/edit → ubah field → simpan → tampilkan perubahan.

**Flow nonaktif:** klik nonaktif → modal konfirmasi → update mock state. Jangan hard delete produk yang telah digunakan transaksi.

## 5. Flow Admin — penyesuaian stok

1. Buka Persediaan.
2. Cari produk.
3. Lihat stok fisik, reserved, available, dan minimum.
4. Klik “Sesuaikan stok”.
5. Masukkan jumlah perubahan (+/-) dan alasan.
6. Tinjau stok akhir.
7. Konfirmasi.
8. Update demo state dan tampilkan toast.

Jangan mengizinkan perubahan stok tanpa alasan. Pada backend kelak, penyesuaian harus tercatat sebagai stock movement dan mungkin memerlukan persetujuan.

## 6. Flow Staff/Kasir — POS

1. Masuk sebagai Staff/Kasir.
2. POS menampilkan fokus pada kolom pencarian/barcode.
3. Cari produk atau masukkan barcode (scanner berperilaku seperti keyboard).
4. Tambahkan item ke keranjang.
5. Pilih pelanggan atau “Pelanggan umum”.
6. Tier harga ditampilkan dengan label yang jelas.
7. Ubah kuantitas; harga dihitung ulang berdasarkan tier + batas kuantitas.
8. Tampilkan subtotal, diskon (jika diizinkan), total, dan stok tersedia.
9. Klik “Bayar”.
10. Pilih tunai, transfer, atau QRIS demo.
11. Untuk tunai, masukkan nominal diterima dan tampilkan kembalian.
12. Konfirmasi pembayaran.
13. Tampilkan sukses, nomor transaksi demo, ringkasan, dan preview struk.
14. Kasir dapat memulai transaksi baru atau membuka dialog cetak.

**Validasi:**
- Qty harus bilangan positif.
- Qty tidak boleh melebihi available stock dalam mode demo.
- Total tidak boleh negatif.
- Pembayaran tunai tidak boleh kurang dari total.
- Klik ganda tidak boleh membuat dua transaksi dalam state demo.
- Aksi transaksi menunjukkan label demo.

## 7. Flow Customer — toko online

1. Buka katalog.
2. Cari produk atau filter kategori.
3. Buka detail produk.
4. Pilih kuantitas.
5. Tambah ke keranjang.
6. Keranjang menampilkan tier/harga yang berlaku dan total.
7. Checkout meminta nama penerima, telepon, alamat, catatan, dan metode pengiriman.
8. Pilih kurir toko atau kurir eksternal demo.
9. Tampilkan ongkir contoh dan total akhir.
10. Pilih transfer manual atau gateway demo.
11. Tampilkan instruksi simulasi, bukan bukti pembayaran sungguhan.
12. Konfirmasi pesanan demo.
13. Tampilkan nomor pesanan dan status.
14. Buka riwayat untuk melihat status dan nomor resi mock.

**Aturan UX:** jika checkout meminta login, pertahankan keranjang setelah login demo. Jelaskan kapan harga/ongkir masih estimasi.

## 8. Flow Admin — pesanan dan pengiriman

1. Buka daftar pesanan.
2. Filter status/channel.
3. Buka detail pesanan.
4. Tinjau item, tier, alamat, metode pembayaran, dan status pembayaran.
5. Ubah status melalui transisi yang valid.
6. Untuk pengiriman, isi provider dan nomor resi demo.
7. Simpan dan tampilkan timeline status.
8. Tampilkan label bahwa tracking belum tersambung ke kurir nyata.

## 9. Flow piutang

1. Admin/Owner membuka Piutang.
2. Cari pelanggan dan lihat total outstanding, jatuh tempo, dan umur piutang.
3. Buka detail tagihan.
4. Catat pembayaran sebagian atau penuh.
5. Masukkan nominal, metode, dan catatan referensi.
6. Validasi nominal > 0 dan tidak melebihi saldo piutang.
7. Tampilkan saldo baru dan riwayat pembayaran.
8. Jangan menambah omzet ketika mencatat pelunasan piutang.

## 10. Flow error dan recovery

- Produk tidak ditemukan → tampilkan pesan + sarankan periksa SKU/barcode.
- Stok kurang → tampilkan jumlah tersedia dan cegah lanjut.
- Aturan harga tidak tersedia → fallback ke Eceran dengan indikator; jangan memberikan harga grosir.
- Form invalid → error dekat field dan fokus ke field pertama invalid.
- Aksi destruktif → konfirmasi dengan nama objek.
- Data kosong → empty state dengan CTA yang sesuai role.
- Error mock/API → pesan yang bisa ditindaklanjuti dan tombol coba lagi.
- Koneksi API belum aktif → tampilkan banner `Mode demo`; jangan menyimulasikan seolah transaksi nyata sukses.

## 11. Acceptance checklist

- [ ] Setiap role memiliki entry point dan navigasi sesuai tugas.
- [ ] Flow POS dapat diselesaikan hanya dengan keyboard untuk pencarian, qty, dan pembayaran dasar.
- [ ] Perubahan qty mengubah tier price secara konsisten.
- [ ] Checkout online menampilkan ongkir dan total secara terpisah.
- [ ] Piutang menampilkan saldo setelah pembayaran sebagian.
- [ ] Semua aksi penting memiliki state sukses/gagal.
- [ ] Tidak ada dead-end tanpa cara kembali.
- [ ] Layout mobile tetap dapat digunakan pada lebar 360 px.
