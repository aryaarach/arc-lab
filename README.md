# Arc Lab — Studio Desain Grafis untuk UMKM

Website produksi **Arc Lab** dengan arah visual **"Swiss Minimal"** (*International Typographic Style*) yang dipadukan dengan **Studio Mockup 3D Fotorealistik**, dibangun menggunakan **Nuxt 3 (Vue 3 `<script setup>`)**, **Tailwind CSS**, **`@nuxt/fonts`**, dan **Three.js**. Seluruh teks antarmuka berbahasa Indonesia dan siap di-deploy ke **Vercel tanpa konfigurasi tambahan (zero-config)**.

## Redesign Swiss (`redesign/swiss`)

Pembaruan identitas visual menyeluruh dari gaya *Neo-Brutalist Lab* menjadi estetika **Swiss Minimal** yang rasional, presisi, tenang, dan berfokus penuh pada kekuatan sistem grid 12 kolom serta tipografi grotesk — tanpa mengubah nama komponen, urutan bagian, maupun logika aplikasi (`useBrandState`, `mockups`, `labelCanvas`, `PriceCalc`, `v-reveal`, serta konfigurasi WhatsApp & Instagram pada `app.config.ts`).

### 1. Alur Kerja Cabang Git (Branch Workflow)

Cabang `redesign/swiss` dibuat langsung dari `main` agar riwayat produksi tetap bersih dan mudah ditinjau melalui *Preview Deployment*:

```bash
# Membuat atau berpindah ke cabang redesign/swiss dari main
git checkout -b redesign/swiss main
# (atau jika cabang sudah ada: git checkout redesign/swiss)

# Menjalankan server pengembangan lokal
cd arc-lab
npm install
npm run dev

# Mendorong cabang ke repositori jarak jauh untuk pratinjau otomatis
git push -u origin redesign/swiss

# Menggabungkan kembali ke main setelah disetujui
git checkout main
git merge redesign/swiss
git push origin main
```

### 2. Palet Warna & Tipografi

**Palet Warna (`tailwind.config.ts`):**
- **White** (`#FFFFFF`) — Latar utama halaman yang bersih
- **Off-White** (`#F2F2F0`) — Permukaan sekunder dan latar panggung studio
- **Black** (`#0A0A0A`) — Teks utama kontras tinggi, tombol primer, serta bagian terbalik (*inverted sections*)
- **Mid-Gray** (`#8A8A86`, pendamping kontras teks kecil `#595955`) — Metadata sekunder dan harga coret
- **Line** (`#D9D9D5`) — Garis pemisah struktural `1px` (tanpa *drop shadow* sama sekali)
- **Signal Red** (`#E63312`) — Satu-satunya warna aksen: status aktif, titik logo Arc Lab, cincin fokus `2px`, angka kunci, dan kondisi *hover* tombol primer

**Tipografi (`@nuxt/fonts` dengan `display: 'swap'`):**
- **Grotesk Tunggal (`Space Grotesk`, bobot `400–700`):** Digunakan untuk seluruh judul raksasa (hero `96–160px` desktop, `56px` seluler dengan *tight tracking* `-0.03em`) dan teks antarmuka rata kiri (*left-aligned, ragged-right*).
- **Indeks & Keterangan Teknis (`JetBrains Mono`, bobot `400–600`):** Digunakan khusus untuk nomor indeks kecil dan label keterangan (`11–12px`, huruf kapital).

### 3. Cara Preview Cabang `redesign/swiss` di Vercel

1. Hubungkan repositori GitHub ke [Vercel](https://vercel.com/new). Jika proyek berada di dalam subfolder `arc-lab`, atur **Root Directory** ke `arc-lab` (**Framework Preset: Nuxt.js** terdeteksi otomatis secara *zero-config*).
2. Dorong cabang `redesign/swiss` ke GitHub:
   ```bash
   git push -u origin redesign/swiss
   ```
3. Vercel secara otomatis membangun **Preview Deployment** terisolasi untuk `redesign/swiss` dan menghasilkan URL pratinjau khusus di dasbor Vercel maupun di Pull Request tanpa memengaruhi domain produksi `main`.

---

## Arsitektur Studio Mockup 3D

Fitur *Photoreal Studio Mockup* pada bagian **Hero** dan **Brand Mixer** didukung oleh modul berikut:

- [`composables/useBrandState.ts`](./composables/useBrandState.ts) — State reaktif lintas komponen berbasis `useState` (aman untuk SSR): `brandName` (maks. 18 karakter, bawaan `"KOPI SENJA"`), `vibe`, `colorHex`, `finish`, `productId`, dan `backdropId`, beserta daftar katalog 10 produk, palet warna, dan preset latar siklorama.
- [`utils/labelCanvas.ts`](./utils/labelCanvas.ts) — Generator label cetak `drawLabel(brand, vibe, colorHex, layout)` yang menunggu `document.fonts.ready`, mendukung 4 gaya (*Minimalis*, *Playful*, *Premium*, *Retro*), 4 tata letak (`wrap` 2:1, `front` 1:1, `card`, `sticker`), serta tekstur *grain* kertas halus bergaya cetakan asli.
- [`utils/mockups.ts`](./utils/mockups.ts) — 10 pembangun produk 3D prosedural berbasis `MeshPhysicalMaterial` (Pouch standing, Box kemasan, Kaleng minuman, Cup minuman, Botol kaca berisi cairan, Toples kaca, Tote bag kanvas, Paper bag toko, tumpukan Kartu nama, dan Sticker sheet vinil).
- [`utils/threeStage.ts`](./utils/threeStage.ts) — Utilitas panggung foto studio bersama (diimpor secara *lazy-load* di sisi klien): `RoomEnvironment` via `PMREMGenerator`, pencahayaan 3 titik dengan bayangan lembut (`PCFSoftShadowMap`), latar siklorama tanpa sambungan (`ExtrudeGeometry`), bayangan kontak radial, tangkapan foto PNG resolusi 2x, dan pembersihan memori menyeluruh (`dispose`).

## Konfigurasi Kontak Terpusat

Nomor WhatsApp dan akun Instagram studio dikelola terpusat di [`app.config.ts`](./app.config.ts):

```ts
export default defineAppConfig({
  studioName: 'Arc Lab',
  whatsappNumber: '6281234567890',
  instagramHandle: '@arclab.studio',
  email: 'halo@arclab.studio',
  location: 'Bandung & Jakarta · 100% Online se-Indonesia'
})
```

## Menjalankan Proyek Secara Lokal

Pastikan Node.js (versi 18+) atau Bun sudah terpasang, lalu jalankan di dalam direktori `arc-lab`:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di peramban.
