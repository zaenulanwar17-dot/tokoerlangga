# API Specification — Warung Sembako POS

- **Status:** Kontrak rancangan untuk integrasi mendatang; belum ada backend aktif.
- **Style:** REST JSON, version prefix `/api/v1`.
- **Frontend:** React + Vite hanya memanggil API melalui service/repository layer.
- **Auth:** Bearer access token saat backend tersedia.
- **Waktu:** ISO 8601; mata uang IDR sebagai integer rupiah untuk nominal bulat.
- **Catatan:** Mock adapter mengimplementasikan interface serupa tanpa network.

## 1. Prinsip kontrak

1. UI tidak mengimpor Supabase SDK langsung ke komponen.
2. Semua request API lewat `src/services/` atau repository interface.
3. Server adalah sumber kebenaran harga, stok, role, ongkir, total, dan status pembayaran.
4. Jangan mempercayai `unitPrice`, `discount`, `role`, atau `grandTotal` dari browser.
5. Endpoint mutasi yang berisiko harus memerlukan autentikasi, otorisasi, validasi, dan audit.
6. Gunakan idempotency key untuk pembuatan pesanan/transaksi dan penerimaan webhook.
7. API belum diimplementasikan pada fase frontend. Gunakan mock adapter yang mudah diganti.

## 2. Bentuk respons umum

Sukses:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_example"
  }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali data yang dikirim.",
    "details": [
      { "field": "sku", "message": "SKU wajib diisi." }
    ],
    "requestId": "req_example"
  }
}
```

HTTP status yang umum:
- `200` sukses baca/update.
- `201` resource dibuat.
- `204` berhasil tanpa body.
- `400` request tidak valid.
- `401` belum login/token invalid.
- `403` tidak memiliki izin.
- `404` resource tidak ditemukan.
- `409` konflik stok/status/idempotensi.
- `422` aturan bisnis tidak terpenuhi.
- `429` rate limit.
- `500` error tak terduga.

## 3. Enum utama

```ts
type Role = 'OWNER' | 'ADMIN' | 'STAFF' | 'CUSTOMER';
type PriceTier = 'RETAIL' | 'WHOLESALE_1' | 'WHOLESALE_2';
type SalesChannel = 'POS' | 'ONLINE';
type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER_MANUAL'
  | 'PAYMENT_GATEWAY'
  | 'COD';
type PaymentStatus =
  | 'PENDING'
  | 'AWAITING_VERIFICATION'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';
type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';
type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
```

## 4. Auth dan profil

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| POST | `/auth/login` | Public | Login |
| POST | `/auth/logout` | Authenticated | Logout |
| POST | `/auth/refresh` | Public/token | Refresh sesi |
| GET | `/me` | Authenticated | Profil dan role aktif |
| PATCH | `/me` | Authenticated | Update profil sendiri |
| GET | `/admin/users` | Owner/Admin sesuai policy | Daftar pengguna |
| PATCH | `/admin/users/{id}/role` | Owner atau policy khusus | Ubah role dengan audit |

Pendaftaran publik hanya boleh membuat Customer. Role Owner/Admin/Staff tidak boleh ditentukan dari payload registrasi publik.

## 5. Produk dan harga

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| GET | `/products` | Public/Auth | Daftar produk aktif, filter, pagination |
| GET | `/products/{id}` | Public/Auth | Detail produk |
| POST | `/admin/products` | Admin/Owner | Buat produk |
| PATCH | `/admin/products/{id}` | Admin/Owner | Ubah produk |
| POST | `/admin/products/{id}/deactivate` | Admin/Owner | Nonaktifkan produk |
| GET | `/admin/products/{id}/price-rules` | Admin/Owner | Lihat aturan harga |
| PUT | `/admin/products/{id}/price-rules` | Admin/Owner | Ganti aturan harga secara tervalidasi |
| POST | `/pricing/quote` | Auth/Public sesuai tier | Minta quote harga untuk produk dan qty |

Contoh product:

```json
{
  "id": "prod_123",
  "sku": "MINYAK-1L",
  "barcode": "899000000001",
  "name": "Minyak Goreng 1 Liter",
  "unit": "pcs",
  "categoryId": "cat_1",
  "isActive": true,
  "stock": {
    "onHand": 80,
    "reserved": 5,
    "available": 75,
    "status": "IN_STOCK"
  }
}
```

Contoh aturan harga:

```json
{
  "productId": "prod_123",
  "rules": [
    { "tier": "RETAIL", "minQuantity": 1, "unitPrice": 18000 },
    { "tier": "WHOLESALE_1", "minQuantity": 1, "unitPrice": 17000 },
    { "tier": "WHOLESALE_1", "minQuantity": 12, "unitPrice": 16500 },
    { "tier": "WHOLESALE_2", "minQuantity": 1, "unitPrice": 16000 }
  ]
}
```

## 6. Persediaan

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| GET | `/inventory` | Owner/Admin/Staff terbatas | Daftar stok |
| GET | `/inventory/movements` | Owner/Admin | Riwayat pergerakan |
| POST | `/admin/inventory/adjustments` | Admin; approval policy | Buat penyesuaian |
| GET | `/admin/inventory/low-stock` | Owner/Admin/Staff sesuai policy | Daftar stok menipis |
| GET | `/admin/suppliers` | Admin/Owner | Daftar supplier |
| POST | `/admin/purchases` | Admin/Owner | Buat pesanan pembelian |
| POST | `/admin/goods-receipts` | Admin/Owner | Terima barang |

Server wajib menerapkan transaksi atomik untuk mengubah stok dan menulis stock movement. Perubahan stok tanpa alasan tidak diterima.

## 7. POS dan transaksi

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| POST | `/pos/quotes` | Staff/Admin sesuai policy | Hitung quote keranjang |
| POST | `/pos/orders` | Staff/Admin sesuai policy | Buat transaksi POS |
| GET | `/pos/orders` | Staff terbatas/Admin/Owner | Riwayat transaksi |
| GET | `/pos/orders/{id}` | Role sesuai policy | Detail transaksi |
| POST | `/pos/orders/{id}/cancel` | Authorized role | Pembatalan dengan audit |
| POST | `/pos/orders/{id}/returns` | Authorized role | Ajukan/proses retur |
| POST | `/pos/shifts/open` | Staff | Buka shift |
| POST | `/pos/shifts/{id}/close` | Staff dengan policy | Tutup shift |

Pembuatan POS harus menerima daftar `productId`, `quantity`, `customerId` opsional, pembayaran, dan `idempotencyKey`. Server menghitung ulang tier/harga, stok, diskon, total, dan kembalian.

## 8. Checkout dan pesanan online

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| POST | `/checkout/quote` | Customer | Hitung harga, stok, ongkir estimasi |
| POST | `/orders` | Customer | Buat pesanan |
| GET | `/orders` | Customer/Admin/Owner sesuai policy | Daftar pesanan |
| GET | `/orders/{id}` | Pemilik pesanan/Admin/Owner | Detail pesanan |
| POST | `/orders/{id}/cancel` | Pemilik/policy | Batalkan jika status mengizinkan |
| PATCH | `/admin/orders/{id}/status` | Admin/Owner/Staff sesuai policy | Transisi status |
| POST | `/admin/orders/{id}/shipment` | Admin/Staff sesuai policy | Catat pengiriman/resi |
| GET | `/orders/{id}/tracking` | Pemilik pesanan/Admin/Owner | Tracking yang tersedia |

`POST /orders` harus mengunci/mengurangi stok secara konsisten dan menyimpan snapshot nama/SKU/harga/alamat. Status dan masa penahanan stok ditentukan server.

## 9. Pembayaran manual dan gateway

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| POST | `/orders/{id}/payments/manual-transfer` | Customer pemilik pesanan | Catat instruksi/bukti transfer |
| POST | `/admin/payments/{id}/verify` | Admin/Owner dengan policy | Verifikasi transfer manual |
| POST | `/orders/{id}/payments/gateway-session` | Customer | Buat sesi gateway |
| POST | `/webhooks/payments/{provider}` | Provider server-to-server | Webhook terverifikasi |
| GET | `/payments/{id}` | Pemilik/Admin/Owner sesuai policy | Status pembayaran |

Webhook wajib diverifikasi melalui signature/provider SDK di backend. Jangan menaruh secret gateway di Vite environment yang dipublikasikan ke browser. Transfer manual tidak boleh otomatis dianggap lunas hanya karena pelanggan mengunggah gambar.

## 10. Piutang

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| GET | `/receivables` | Owner/Admin; customer hanya miliknya | Daftar piutang |
| GET | `/receivables/{id}` | Owner/Admin/pemilik sesuai policy | Detail piutang |
| POST | `/receivables/{id}/payments` | Staff/Admin/Owner sesuai policy | Catat pembayaran |
| GET | `/receivables/{id}/payments` | Role sesuai policy | Riwayat pembayaran |

Pembayaran cicilan harus dialokasikan ke piutang dan tidak menciptakan transaksi penjualan baru.

## 11. Pengiriman dan kurir

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| GET | `/shipping/quotes` | Customer/Admin | Ongkir dari provider yang tersedia |
| GET | `/admin/shipping/providers` | Admin/Owner | Konfigurasi provider |
| POST | `/admin/orders/{id}/shipment` | Admin/Staff sesuai policy | Buat shipment |
| GET | `/shipments/{id}/tracking` | Pemilik pesanan/Admin/Owner | Status tracking |

Integrasi provider dilakukan di backend. Frontend hanya menerima normalized response dan tidak menyimpan kredensial kurir.

## 12. Laporan dan audit

| Method | Endpoint | Role | Tujuan |
|---|---|---|---|
| GET | `/reports/overview?from=&to=` | Owner/Admin sesuai policy | KPI |
| GET | `/reports/sales?from=&to=&channel=` | Owner/Admin | Penjualan |
| GET | `/reports/inventory` | Owner/Admin | Persediaan |
| GET | `/reports/receivables` | Owner/Admin | Piutang |
| GET | `/admin/audit-logs` | Owner/Admin dengan policy | Aktivitas penting |

Laporan harus menjelaskan definisi metrik. Omzet, kas masuk, piutang, HPP, laba kotor, dan laba bersih bukan nilai yang dapat saling menggantikan.

## 13. Pagination, filter, dan sort

Gunakan pola query konsisten:
- `page=1`
- `pageSize=20` (maksimum ditetapkan backend)
- `q=kata`
- `sortBy=createdAt`
- `sortOrder=desc`
- filter spesifik sesuai endpoint.

Contoh:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "requestId": "req_example"
  }
}
```

## 14. Frontend service interfaces

Buat interface TypeScript terpisah dari komponen:

```ts
interface ProductRepository {
  list(params?: ProductListParams): Promise<ProductListResult>;
  getById(id: string): Promise<Product>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product>;
}

interface PricingService {
  quote(input: PricingQuoteInput): Promise<PricingQuote>;
}

interface InventoryRepository {
  list(params?: InventoryListParams): Promise<InventoryListResult>;
  adjust(input: StockAdjustmentInput): Promise<StockMovement>;
}
```

Implementasi pertama adalah `MockProductRepository`, `MockPricingService`, dan `MockInventoryRepository`. Implementasi HTTP dapat ditambahkan kemudian tanpa mengubah halaman.

## 15. Batas integrasi

- Semua route di dokumen ini adalah rancangan, bukan endpoint yang telah tersedia.
- Jangan membuat `.env` dengan credential palsu yang tampak nyata.
- Jangan membuat pembayaran atau resi palsu terlihat live.
- Backend harus menerapkan role enforcement, validasi schema, rate limiting, audit, idempotensi, dan transaksi stok.
