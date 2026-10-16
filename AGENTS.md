# AGENTS.md — Instruksi untuk AI Coding Agent

## Misi

Bangun frontend **Warung Sembako POS** terlebih dahulu agar dapat divalidasi oleh pemilik produk. Stack wajib: HTML semantik, React, Vite, TypeScript, Tailwind CSS. Backend/database belum dibuat sampai frontend disetujui.

## Urutan sumber kebenaran

1. `docs/PRD.md` — scope dan prioritas.
2. `docs/USER-FLOW.md` — perilaku dan transisi.
3. `docs/UI-GUIDELINE.md` — visual dan komponen.
4. `docs/API-SPEC.md` — kontrak integrasi masa depan.
5. `docs/PROMPT-EXECUTION.md` — urutan eksekusi agent.

Jika ada konflik, jangan menebak diam-diam. Pilih aturan paling sempit yang konsisten, catat asumsi, dan laporkan konflik.

## Stack dan batas arsitektur

- React + Vite + TypeScript.
- Tailwind CSS.
- Gunakan React Router untuk route.
- Gunakan satu library ikon konsisten, disarankan Lucide React.
- Form menggunakan validasi terstruktur dan pesan error yang jelas.
- Chart hanya bila membantu keputusan; jangan memasang library chart besar untuk visual dekoratif.
- Semua akses data melewati `src/services/` atau `src/repositories/`.
- Mock data dan mock adapter berada di layer terpisah.
- Komponen tidak boleh mengimpor mock arrays langsung atau memanggil `fetch`/SDK database secara langsung.
- Jangan membuat backend, database, SQL migration, Supabase client, payment integration, atau courier integration pada fase frontend.
- Jangan menggunakan microfrontend, Redux, monorepo, dependency injection framework, atau state management kompleks tanpa kebutuhan terukur.
- Mulai dari React state/context sederhana. Tambahkan library hanya jika kebutuhan terbukti.

## Aturan produk

- Satu toko, satu gudang.
- Empat role: OWNER, ADMIN, STAFF, CUSTOMER.
- Tier harga: RETAIL, WHOLESALE_1, WHOLESALE_2.
- Harga mengikuti tier pelanggan dan kuantitas.
- Harga, stok, dan pembayaran di mock mode bukan sumber kebenaran produksi.
- Tampilkan `MODE DEMO` dengan jelas.
- Role demo bukan autentikasi atau otorisasi nyata.
- Jangan mengarang integrasi atau status pembayaran/kurir yang live.
- Semua aksi utama harus berfungsi pada mock state atau ditandai jelas sebagai belum tersedia; hindari tombol palsu.
- Jangan menyimpan secret di frontend.

## Kualitas UI

- Ikuti token warna di UI-GUIDELINE.
- Prioritaskan keterbacaan dan kepadatan data yang masuk akal.
- Jangan memakai gradient, glow, blur, atau card berlebihan sebagai dekorasi.
- Hindari lorem ipsum; gunakan copy Bahasa Indonesia yang realistis.
- Semua halaman harus punya loading, empty, error, dan success state yang relevan.
- Form punya label, validasi, dan feedback.
- Aksesibilitas keyboard, focus state, semantic HTML, dan kontras wajib diperhatikan.
- Uji responsif pada 360, 390, 768, 1024, 1440 px.

## Standar kode

- TypeScript strict; hindari `any`.
- Komponen kecil dan bernama sesuai fungsi.
- Pisahkan domain types, business logic, UI, dan data.
- Format rupiah melalui helper terpusat menggunakan `Intl.NumberFormat`.
- Logika harga/total murni dan memiliki unit tests.
- Hindari duplikasi tipe dan aturan bisnis.
- Hindari file komponen raksasa.
- Jangan mengubah dependency tanpa alasan.
- Jangan menambahkan fitur di luar P0 sebelum P0 stabil.

## Cara kerja wajib

1. Baca semua file dalam `docs/`.
2. Periksa struktur proyek yang sudah ada sebelum mengubahnya.
3. Buat rencana singkat dan daftar file yang akan dibuat.
4. Implementasikan vertical slice kecil dan dapat dijalankan.
5. Jalankan tests, typecheck, dan build jika command tersedia.
6. Perbaiki semua error yang diperkenalkan.
7. Laporkan file penting, command yang dijalankan, hasil yang benar-benar teramati, dan hal yang belum dilakukan.

## Definition of done

- `npm run dev` dapat dijalankan setelah instalasi.
- `npm run build`, typecheck, dan unit tests lulus di lingkungan agent, atau kegagalan lingkungan dijelaskan dengan jujur.
- P0 pada PRD tersedia dengan mock adapter.
- Semua route utama dapat dibuka dan dinavigasi.
- Role demo menunjukkan navigasi sesuai role.
- Harga bertingkat diuji.
- Tidak ada credential produksi.
- README menjelaskan setup dan batasan demo.
- Tidak ada klaim deploy/integrasi yang belum diverifikasi.

## Larangan

- Jangan membangun backend/database sebelum persetujuan frontend.
- Jangan menghapus dokumen SOT atau mengubah keputusan produk tanpa mencatat alasannya.
- Jangan menyamarkan mock data sebagai data real.
- Jangan menyatakan test/build sukses jika command tidak dijalankan atau gagal.
- Jangan menambahkan scope “agar terlihat lengkap” tanpa kebutuhan di PRD.
