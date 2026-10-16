# PROMPT-EXECUTION — Eksekusi Pertama AI Coding Agent

> Jalankan prompt ini setelah semua file SOT dalam folder `docs/` tersedia di repository proyek.

## Prompt utama

Anda bertindak sebagai Senior Frontend Engineer, Product-minded UI Engineer, dan QA Engineer. Bangun frontend Warung Sembako POS sesuai seluruh dokumen SOT di folder `docs/`.

### Tahap 0 — pahami konteks sebelum coding

1. Baca `AGENTS.md`, `PRD.md`, `USER-FLOW.md`, `UI-GUIDELINE.md`, dan `API-SPEC.md`.
2. Periksa repository dan package manager yang telah ada. Jangan menghapus file yang tidak dipahami.
3. Ringkas scope P0, arsitektur frontend, route, dan asumsi yang diperlukan.
4. Jika repository kosong, inisialisasi React + Vite + TypeScript dan Tailwind CSS sesuai versi yang saling kompatibel. Gunakan dokumentasi resmi versi yang dipasang, jangan menebak konfigurasi plugin.
5. Jangan membuat backend, database, migration, atau integrasi layanan eksternal.

### Tahap 1 — scaffold minimum

Siapkan struktur yang sederhana, misalnya:

```text
src/
  app/
    App.tsx
    router.tsx
  components/
    layout/
    ui/
    feedback/
  features/
    storefront/
    owner/
    admin/
    pos/
    inventory/
    orders/
    receivables/
  domain/
    types.ts
    pricing.ts
    money.ts
  services/
    contracts/
    mock/
  data/
    demo-data.ts
  styles/
    index.css
  test/
```

Sesuaikan jika struktur proyek yang ada lebih baik. Jangan membuat folder yang belum diperlukan.

### Tahap 2 — domain dan data mock

1. Buat tipe `Role`, `PriceTier`, `Product`, `PriceRule`, `InventoryBalance`, `CartItem`, `Order`, `Payment`, dan `Receivable`.
2. Buat helper `formatIDR`.
3. Buat fungsi murni untuk menentukan harga dari tier + quantity, menghitung subtotal/discount/total, dan menghitung stok tersedia.
4. Validasi kuantitas positif dan aturan harga tidak tumpang tindih.
5. Buat mock repository untuk produk, harga, stok, pesanan, dan piutang.
6. Tampilkan banner `MODE DEMO — data contoh, belum tersambung ke backend`.
7. Tambahkan unit tests untuk batas kuantitas, tier berbeda, aturan fallback, stok habis, dan total transaksi.

### Tahap 3 — UI shell dan routing

Bangun:
- Storefront `/`.
- Katalog `/produk` dan detail produk.
- Keranjang `/keranjang` dan checkout `/checkout`.
- Login/demo role switcher `/login`.
- Owner `/app/owner`.
- Admin `/app/admin`.
- POS `/app/kasir`.
- Produk `/app/produk`.
- Harga `/app/harga`.
- Persediaan `/app/persediaan`.
- Pesanan `/app/pesanan`.
- Piutang `/app/piutang`.
- Laporan `/app/laporan`.
- Pesanan Customer `/akun/pesanan`.

Route boleh dikelompokkan jika struktur yang lebih ringkas tetap jelas. Tambahkan fallback 404 dan navigasi kembali yang masuk akal.

### Tahap 4 — implementasikan vertical slice berurutan

1. Shell, navigation, responsive behavior, dan role demo.
2. Storefront + pencarian/kategori + detail + cart.
3. Product list/form + editor harga bertingkat.
4. POS + customer/tier + cart + pembayaran demo + receipt preview.
5. Inventory + stock adjustment mock.
6. Online checkout + delivery option mock + order status.
7. Owner dashboard + laporan ringkas + stok menipis + piutang.
8. Admin order management + shipment tracking number mock.
9. States dan detail UX yang belum lengkap.

Setiap tombol yang terlihat aktif harus melakukan tindakan yang masuk akal. Bila belum didukung, tampilkan disabled state dan penjelasan; jangan diam-diam tidak melakukan apa-apa.

### Tahap 5 — visual quality

Ikuti `UI-GUIDELINE.md`:
- Sage, magenta, dan black/charcoal sebagai sistem warna.
- Antarmuka rapi, fungsional, tidak penuh gradient atau kartu dekoratif.
- POS berorientasi kecepatan, dashboard berorientasi keputusan, storefront berorientasi belanja.
- Bahasa Indonesia yang natural.
- Form, tabel, dialog, toast, empty/error/loading state.
- Uji lebar 360, 390, 768, 1024, dan 1440 px.

### Tahap 6 — integrasi API-ready

Buat interface service sesuai `API-SPEC.md`. Untuk fase ini hanya implementasikan mock adapter. Jangan memanggil API eksternal dan jangan membuat asumsi bahwa endpoint telah tersedia. UI harus dapat beralih ke HTTP repository kelak dengan perubahan terlokalisasi.

### Tahap 7 — QA

Jalankan command yang tersedia:
- `npm run test`
- `npm run typecheck`
- `npm run build`

Jika command belum ada, tambahkan script yang sesuai. Perbaiki error yang disebabkan kode. Jangan mengklaim sukses tanpa output command yang sukses.

Periksa:
- role demo dan navigasi;
- aturan tier + kuantitas;
- form validation;
- kalkulasi total dan kembalian;
- stok available;
- checkout dan status demo;
- piutang setelah pembayaran sebagian;
- keyboard/focus dan layout mobile;
- tidak ada secret di bundle;
- tidak ada tombol utama yang dead.

### Tahap 8 — hasil akhir yang harus dilaporkan

Berikan:
1. Ringkasan yang sudah dibuat.
2. Daftar halaman/fitur yang dapat dicoba.
3. Cara instalasi dan menjalankan.
4. Tests/typecheck/build yang benar-benar dijalankan dan hasilnya.
5. Batasan mock dan daftar integrasi yang belum dibuat.
6. Asumsi/keputusan yang memerlukan review pemilik produk.
7. Jangan lanjut ke backend/database sampai pengguna menyatakan frontend sudah disetujui.

## Guardrail anti over-engineering

- Jangan menambahkan state manager global kompleks kecuali kebutuhan terukur.
- Jangan membuat design system besar; bangun komponen yang dipakai berulang.
- Jangan menambahkan fitur P1 sebelum P0 bisa dicoba.
- Jangan membuat chart dekoratif atau metrik yang tidak punya definisi.
- Jangan menambahkan microservices, monorepo, GraphQL, event bus, atau multi-tenant.
- Jangan mengintegrasikan pembayaran/kurir sebelum ada pilihan provider dan kredensial backend.
- Jangan membuat offline sync dalam tahap frontend.
- Jangan mengganti stack yang disepakati tanpa meminta persetujuan.
