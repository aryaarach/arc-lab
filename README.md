# Arc Lab — Studio Desain Grafis untuk UMKM

Website produksi **Arc Lab** dengan arah visual **"Editorial Hangat"** (`#FAF7F2` cream, `#EFE8DC` sand, `#1F1A17` espresso, dan aksen `#C8553D` terracotta) yang dipadukan dengan **Studio Mockup 3D Fotorealistik**, dibangun menggunakan **Nuxt 3 (Vue 3 `<script setup>`)**, **Tailwind CSS**, **`@nuxt/fonts`**, dan **Three.js**. Seluruh teks berbahasa Indonesia dan siap di-deploy ke **Vercel tanpa konfigurasi tambahan (zero-config)**.

## Redesign v2 — "Editorial Hangat" (`redesign/v2`)

Pembaruan identitas visual menyeluruh dari gaya *Neo-Brutalist Lab* menjadi estetika majalah editorial dan studio modern yang tenang, hangat, serta premium tanpa mengubah urutan bagian maupun logika bisnis (`useBrandState`, `mockups`, `labelCanvas`, `PriceCalc`, `v-reveal`, serta tautan WhatsApp & Instagram).

### 1. Alur Kerja Cabang Git (Branch Workflow)

Pengembangan Redesign v2 terisolasi pada cabang `redesign/v2` agar versi sebelumnya pada `main` tetap aman untuk dibandingkan atau ditinjau:

```bash
# Berpindah ke cabang redesign v2
git checkout redesign/v2

# Menjalankan server pengembangan lokal
cd arc-lab
bun install   # atau npm install
bun run dev   # atau npm run dev

# Mendorong cabang ke GitHub untuk membuat Preview URL otomatis
git push -u origin redesign/v2

# Menggabungkan ke main setelah disetujui
git checkout main
git merge redesign/v2
git push origin main
```

### 2. Palet Warna & Tipografi Baru

**Palet Warna (`tailwind.config.ts`):**
- **Cream** (`#FAF7F2`) — Latar utama halaman yang bersih dan hangat
- **Sand** (`#EFE8DC`) — Permukaan kartu, bilah marquee, dan bidang transisi lembut
- **Espresso** (`#1F1A17`) — Warna teks utama kontras tinggi (WCAG AAA) serta latar penutup gelap
- **Terracotta** (`#C8553D`, varian kontras teks `#A93F29`) — Aksen utama, tombol pill CTA, cincin fokus 2px, serta simbol busur + titik Arc Lab
- **Sage** (`#8FA48A`, tint `#E3EAE1`) — Aksen sekunder botani pada kartu bento dan lencana
- **Butter** (`#F2D98D`, tint `#F8EDD0`) — Sorotan hangat dan pita diskon paket kombo

**Tipografi (`@nuxt/fonts` dengan `display: 'swap'`):**
- **Display / Judul:** `Fraunces` (serif dengan *optical sizing* otomatis, ukuran besar 72–96px pada hero desktop, dan variasi *italic* editorial)
- **Teks Tubuh & Antarmuka:** `Inter` (400, 500, 600, 700)
- **Eyebrow Label:** `Inter` huruf kapital kecil (*uppercase*) dengan jarak huruf longgar (`letter-spacing: 0.14em`), menggantikan label *monospace* sepenuhnya

**Bentuk & Gerak:**
- Sudut membulat `24px–28px` pada kartu & panggung 3D, tombol berbentuk `pill`, garis pemisah tipis `1px` (`espresso` opasitas 10%), serta bayangan berlapis lembut (`0 20px 50px -20px rgba(31, 26, 23, 0.25)`).
- Transisi halus `500–700ms` dengan kurva `cubic-bezier(0.22, 1, 0.36, 1)` yang otomatis dinonaktifkan penuh saat pengguna mengaktifkan `prefers-reduced-motion`.

### 3. Cara Preview Cabang `redesign/v2` di Vercel

1. Pastikan proyek di Vercel terhubung ke repositori GitHub Anda (jika proyek berada di dalam subfolder `arc-lab`, atur **Root Directory** ke `arc-lab` pada pengaturan proyek Vercel; **Framework Preset: Nuxt.js** terdeteksi otomatis).
2. Dorong cabang ke repositori jarak jauh:
   ```bash
   git push -u origin redesign/v2
   ```
3. Vercel secara otomatis membangun **Preview Deployment** khusus untuk cabang `redesign/v2` dan menampilkan tautan pratinjau unik (mis. `arc-lab-git-redesign-v2-username.vercel.app`) di dasbor Vercel maupun pada Pull Request GitHub tanpa memengaruhi domain produksi `main`.

---

## Arsitektur Studio Mockup 3D

Fitur *Photoreal Studio Mockup* pada bagian **Hero** dan **Brand Mixer** didukung oleh modul berikut:

- [`composables/useBrandState.ts`](./composables/useBrandState.ts) — State reaktif lintas komponen berbasis `useState` (aman untuk SSR): `brandName` (maks. 18 karakter, bawaan `"KOPI SENJA"`), `vibe`, `colorHex`, `finish`, `productId`, dan `backdropId`, beserta daftar katalog produk, palet warna, dan preset latar siklorama.
- [`utils/labelCanvas.ts`](./utils/labelCanvas.ts) — Generator label cetak `drawLabel(brand, vibe, colorHex, layout)` yang menunggu `document.fonts.ready`, mendukung 4 gaya (*Minimalis*, *Playful*, *Premium*, *Retro*), 4 tata letak (`wrap` 2:1, `front` 1:1, `card`, `sticker`), serta tekstur *grain* kertas halus bergaya cetakan asli.
- [`utils/mockups.ts`](./utils/mockups.ts) — 10 pembangun produk 3D prosedural berbasis `MeshPhysicalMaterial` (Box kemasan, Kaleng, Cup minuman, Botol kaca berisi cairan, Toples kaca, Pouch standing, Tote bag kanvas bertekstur tenun, Paper shopping bag berlipat samping, tumpukan Kartu nama, dan Sticker sheet vinil berujung melengkung).
- [`utils/threeStage.ts`](./utils/threeStage.ts) — Utilitas panggung foto studio bersama: `RoomEnvironment` via `PMREMGenerator`, pencahayaan 3 titik dengan bayangan lembut (`PCFSoftShadowMap`), latar siklorama tanpa sambungan (`ExtrudeGeometry`), bayangan kontak radial, tangkapan foto PNG resolusi 2x, dan pembersihan memori menyeluruh (`dispose`).

### Cara Menambahkan Mockup Baru

1. Tambahkan satu fungsi pembangun `export function buildNamaProdukMockup(THREE, texture, colorHex, finish, options): MockupBuildResult` di [`utils/mockups.ts`](./utils/mockups.ts) lalu daftarkan pada objek `MOCKUP_BUILDERS`.
2. Tambahkan satu entri metadata produk baru pada `PRODUCT_CATALOG` (dan tipe `ProductId`) di [`composables/useBrandState.ts`](./composables/useBrandState.ts) beserta ikon SVG tipis di `productSvgIcons` pada [`components/BrandMixer.vue`](./components/BrandMixer.vue). Produk baru akan otomatis muncul di *showreel* Hero, pemilih produk, serta lantai studio **Brand Kit**.

## Konfigurasi Kontak Terpusat

Nomor WhatsApp dan akun Instagram studio dikelola di satu file [`app.config.ts`](./app.config.ts):

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
bun install   # atau npm install
bun run dev   # atau npm run dev
```

Buka `http://localhost:3000` di peramban.

## Langkah Deploy Produksi ke Vercel (Zero-Config)

1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "feat(v2): redesign visual identity ke Editorial Hangat"
   git push -u origin redesign/v2
   ```
2. **Import Repo di Vercel**
   Buka [vercel.com/new](https://vercel.com/new), hubungkan akun GitHub Anda, dan pilih **Import** pada repositori `arc-lab`.
3. **Framework Preset: Nuxt.js**
   Vercel otomatis mendeteksi **Framework Preset: Nuxt.js** tanpa pengaturan tambahan. Klik **Deploy**.
