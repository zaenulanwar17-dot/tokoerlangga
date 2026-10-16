# UI Guideline — Warung Sembako POS

- **Status:** SOT v1.0
- **Arah visual:** modern, hangat, rapi, operasional, bukan dashboard template generik.
- **Brand palette:** Sage + Magenta + Black.
- **Prinsip:** legible first, task-first, konsisten, anti AI-slop.

## 1. Brand dan karakter

Warung sembako harus terasa terpercaya, mudah dipahami, dekat dengan keseharian, dan efisien. Gunakan warna sage untuk permukaan/identitas alami, magenta untuk aksi utama yang perlu terlihat, dan hitam/charcoal untuk teks dan struktur.

Hindari:
- Gradient neon di setiap kartu.
- Glassmorphism tanpa fungsi.
- Terlalu banyak kartu dengan radius besar.
- Emoji sebagai ikon navigasi utama.
- Heading marketing yang berlebihan di area kasir.
- Placeholder chart dekoratif yang tidak punya konteks.
- Semua elemen berwarna sekaligus.

## 2. Token warna

Gunakan CSS variables sebagai sumber tunggal. Nilai awal dapat disesuaikan setelah review visual.

```css
:root {
  --color-sage-50: #f4f7f1;
  --color-sage-100: #e5ecdf;
  --color-sage-300: #b4c5aa;
  --color-sage-500: #78916f;
  --color-sage-700: #43583e;

  --color-magenta-50: #fff0f7;
  --color-magenta-300: #f08abb;
  --color-magenta-500: #d63384;
  --color-magenta-700: #9f1d5d;

  --color-ink: #191919;
  --color-ink-soft: #343434;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-surface: #ffffff;
  --color-canvas: #f8f9f7;

  --color-success: #287d4a;
  --color-warning: #a16207;
  --color-danger: #b42318;
  --color-info: #2459a9;
}
```

Aturan penggunaan:
- Canvas aplikasi: putih/off-white.
- Sidebar/teks utama: ink.
- Sage: navigasi aktif sekunder, chip kategori, aksen alami, panel ringkasan.
- Magenta: CTA utama dan fokus interaksi; jangan dipakai untuk semua badge.
- Status success/warning/danger memakai warna semantik, tidak diganti magenta.
- Pastikan kontras teks normal setidaknya setara WCAG AA; cek pasangan warna aktual.

## 3. Tipografi

- Font: `Inter` atau system font stack; hindari memuat banyak keluarga font.
- Body: 14–16 px.
- Label/form helper: 12–14 px.
- Page title: 24–32 px desktop, 22–26 px mobile.
- Dashboard KPI: 24–32 px; gunakan angka tabular jika tersedia.
- POS: harga dan total harus terbaca dari jarak kerja normal.
- Maksimal 2 bobot font dominan per komponen.

## 4. Layout dan grid

- Mobile-first.
- Container storefront: max-width sekitar 1200–1280 px.
- App dashboard: sidebar desktop 240–264 px; konten fleksibel.
- Tablet: sidebar dapat diciutkan.
- Mobile: sidebar berubah menjadi drawer/bottom navigation sesuai konteks.
- Spacing mengikuti skala 4/8 px.
- Border tipis dan shadow sangat ringan.
- Radius: 8–12 px untuk form/card; 6–8 px untuk button/input.
- Hindari ruang kosong yang membuat POS membutuhkan scroll berlebihan.

Breakpoints Tailwind yang disarankan:
- `sm`: 640 px
- `md`: 768 px
- `lg`: 1024 px
- `xl`: 1280 px

## 5. Navigasi per role

### Owner
Dashboard, Penjualan, Persediaan, Piutang, Laporan, Pengaturan.

### Admin
Dashboard, Produk, Harga, Persediaan, Pembelian (jika P1), Pesanan, Pelanggan, Piutang, Pengaturan.

### Staff/Kasir
POS, Transaksi/Struk, Shift Kasir.

### Customer
Beranda, Produk, Keranjang, Pesanan Saya, Profil.

Jangan menampilkan menu dari role lain. Ini hanya perilaku UI; backend wajib memvalidasi izin.

## 6. Komponen inti

- `AppShell`: sidebar/topbar/content.
- `StorefrontHeader`: logo, search, kategori, cart, account.
- `PageHeader`: judul, deskripsi singkat, aksi utama.
- `StatCard`: label, nilai, periode, delta jika datanya tersedia.
- `DataTable`: search/filter/sort/pagination, empty/loading/error state.
- `ProductForm`: field produk dan validasi.
- `PriceTierEditor`: tiga tab/kolom tier, rules kuantitas, preview harga.
- `StockBadge`: tersedia, menipis, habis.
- `ProductSearch`: nama/SKU/barcode.
- `CartPanel`: item, qty, harga tier, subtotal, total.
- `PaymentDialog`: metode, nominal diterima, kembalian.
- `OrderStatusBadge`: label status konsisten.
- `ConfirmDialog`: konfirmasi aksi destruktif.
- `Toast`: sukses/error/informasi.
- `DemoBanner`: selalu terlihat ketika data mock aktif.
- `Skeleton` dan `EmptyState`.

## 7. Pola halaman

### Storefront
Header ringkas, search dominan, kategori, produk dengan harga jelas, CTA tambah ke keranjang. Jangan memuat dashboard metrics di area publik.

### Dashboard Owner
Baris filter tanggal dan 4 KPI utama; grafik sederhana hanya bila memberi insight; tabel transaksi terbaru; panel stok menipis dan piutang jatuh tempo.

### Data management
Page title + CTA, toolbar filter, tabel, aksi per baris, form dalam halaman/modal sesuai kompleksitas. Hindari menampilkan semua field di tabel.

### POS
Layout dua kolom pada desktop: katalog/pencarian sekitar 60%, keranjang sekitar 40%. Total dan tombol bayar harus selalu terlihat. Mobile: daftar produk dan keranjang melalui panel/section yang jelas. Fokus keyboard harus tampak.

### Checkout
Stepper sederhana: Keranjang → Alamat & Pengiriman → Pembayaran → Konfirmasi. Tampilkan subtotal, ongkir, diskon, total; jangan menyembunyikan biaya.

## 8. Form dan feedback

- Label tetap di atas input; jangan hanya mengandalkan placeholder.
- Required ditandai jelas.
- Validasi inline, bahasa Indonesia sederhana.
- Error menjelaskan cara memperbaiki.
- Tombol submit menunjukkan loading dan mencegah double submit.
- Setelah berhasil, tampilkan toast dan state baru.
- Aksi hapus/nonaktif/retur perlu confirmation dialog.
- Modal dapat ditutup dengan Escape dan fokus tidak hilang.
- Semua kontrol dapat digunakan keyboard.

## 9. Tabel dan data padat

- Header tabel jelas dan sticky bila membantu.
- Nominal rupiah rata kanan dan konsisten.
- Jangan mengandalkan warna saja untuk status.
- Pada mobile, ubah tabel menjadi list/card atau izinkan scroll terkontrol dengan indikator.
- Filter penting tidak boleh tersembunyi di menu yang sulit ditemukan.
- Tampilkan empty state berbeda dari error state.

## 10. Format angka dan tanggal

- Rupiah: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`.
- Tanggal: format lokal Indonesia, mis. `14 Okt 2026`.
- Kuantitas mengikuti satuan produk; hindari desimal jika unit hanya bilangan bulat.
- Simpan/transport tanggal dalam format ISO; format lokal hanya untuk tampilan.

## 11. Accessibility dan responsive QA

- Target interaktif minimum sekitar 44×44 px pada touch.
- Focus ring terlihat.
- Semantic HTML: `button`, `nav`, `main`, `form`, `label`, `table`.
- Input memiliki label.
- Status disertai teks, bukan warna saja.
- Hormati `prefers-reduced-motion`.
- Uji 360, 390, 768, 1024, 1440 px.
- Tidak ada horizontal page overflow pada mobile.
- Pastikan kontras dan zoom browser 200% tetap dapat digunakan.

## 12. Ikon dan aset

- Gunakan satu library ikon (mis. Lucide React).
- Hindari emoji untuk ikon fungsi.
- Gunakan foto produk demo yang konsisten dan jangan bergantung pada URL eksternal yang mudah rusak.
- Bila aset belum tersedia, gunakan placeholder produk yang rapi dan diberi label demo.
