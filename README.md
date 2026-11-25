# Arc Lab — Studio Desain Grafis untuk UMKM

Website produksi **Arc Lab** dengan tema antarmuka **Neo-Brutalist Lab** (`#F4F1EA` paper, `#0B0B0F` ink, border 2px tegas, dan bayangan solid `6px 6px 0`) yang dikontraskan dengan **Studio Mockup 3D Fotorealistik**, dibangun menggunakan **Nuxt 3 (Vue 3 `<script setup>`)**, **Tailwind CSS**, dan **Three.js**. Seluruh teks berbahasa Indonesia dan siap di-deploy ke **Vercel tanpa konfigurasi tambahan (zero-config)**.

## Arsitektur Studio Mockup 3D Baru

Pembaruan *Photoreal Studio Mockup* pada bagian **Hero** dan **Brand Mixer** didukung oleh modul berikut:

- [`composables/useBrandState.ts`](./composables/useBrandState.ts) — State reaktif lintas komponen berbasis `useState` (aman untuk SSR): `brandName` (maks. 18 karakter, bawaan `"KOPI SENJA"`), `vibe`, `colorHex`, `finish`, `productId`, dan `backdropId`, beserta daftar katalog produk, palet warna, dan preset latar siklorama.
- [`utils/labelCanvas.ts`](./utils/labelCanvas.ts) — Generator label cetak `drawLabel(brand, vibe, colorHex, layout)` yang menunggu `document.fonts.ready`, mendukung 4 gaya (*Minimalis*, *Playful*, *Premium*, *Retro*), 4 tata letak (`wrap` 2:1, `front` 1:1, `card`, `sticker`), serta tekstur *grain* kertas halus bergaya cetakan asli.
- [`utils/mockups.ts`](./utils/mockups.ts) — 10 pembangun produk 3D prosedural berbasis `MeshPhysicalMaterial` (Box kemasan, Kaleng, Cup minuman, Botol kaca berisi cairan, Toples kaca, Pouch standing, Tote bag kanvas bertekstur tenun, Paper shopping bag berlipat samping, tumpukan Kartu nama, dan Sticker sheet vinil berujung melengkung).
- [`utils/threeStage.ts`](./utils/threeStage.ts) — Utilitas panggung foto studio bersama: `RoomEnvironment` via `PMREMGenerator`, pencahayaan 3 titik dengan bayangan lembut (`PCFSoftShadowMap`), latar siklorama tanpa sambungan (`ExtrudeGeometry`), bayangan kontak radial, tangkapan foto PNG resolusi 2x, dan pembersihan memori menyeluruh (`dispose`).

### Cara Menambahkan Mockup Baru

1. Tambahkan satu fungsi pembangun `export function buildNamaProdukMockup(THREE, texture, colorHex, finish, options): MockupBuildResult` di [`utils/mockups.ts`](./utils/mockups.ts) lalu daftarkan pada objek `MOCKUP_BUILDERS`.
2. Tambahkan satu entri metadata produk baru pada `PRODUCT_CATALOG` (dan tipe `ProductId`) di [`composables/useBrandState.ts`](./composables/useBrandState.ts) beserta ikon SVG tipis di `productSvgIcons` pada [`components/BrandMixer.vue`](./components/BrandMixer.vue). Produk baru akan otomatis muncul di *showreel* Hero, pemilih produk, serta lantai studio **Brand Kit**!

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

Pastikan Node.js (versi 18+) sudah terpasang, lalu jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di peramban.

## Langkah Deploy ke Vercel (Zero-Config)

1. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "feat: studio mockup 3D fotorealistik Arc Lab"
   git branch -M main
   git remote add origin https://github.com/USERNAME/arc-lab.git
   git push -u origin main
   ```
2. **Import Repo di Vercel**
   Buka [vercel.com/new](https://vercel.com/new), hubungkan akun GitHub Anda, dan pilih **Import** pada repositori `arc-lab`.
3. **Framework Preset: Nuxt.js**
   Vercel otomatis mendeteksi **Framework Preset: Nuxt.js** tanpa pengaturan tambahan. Klik **Deploy**.
