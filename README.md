# Arc Lab — Studio Desain Grafis untuk UMKM

Website produksi **Arc Lab** dengan tema **Neo-Brutalist Lab** (`#F4F1EA` paper, `#0B0B0F` ink, border 2px tegas, dan bayangan solid `6px 6px 0`), dibangun menggunakan **Nuxt 3 (Vue 3 `<script setup>`)**, **Tailwind CSS**, dan **Three.js**. Seluruh antarmuka berbahasa Indonesia dan siap di-deploy ke **Vercel tanpa konfigurasi tambahan (zero-config)**.

## Fitur Utama

1. **HeroScene ("Meja Kerja Lab" — Three.js Toon/Flat)**:
   - Kolom kiri (SSR LCP instan tanpa menunggu Three.js) menampilkan judul utama dengan kata sorotan bergilir setiap 2,2 detik via CSS murni (`dilirik.`, `diingat.`, `dipercaya.`), tombol **Mulai Proyek** (`#harga`) & **Coba Brand Mixer** (`#mixer`), deretan metrik kepercayaan, dan stiker miring CSS.
   - Kolom kanan (`<ClientOnly>` + `import('three')` dinamis) menampilkan meja kerja studio bergaya *flat/toon cell-shaded* dengan garis tepi tinta 2px (*inverted-hull*): logo busur 3D di tengah, kotak kemasan koral, kaleng sian, cangkir kuning, primitif dekoratif melayang, dan strip palet 4 warna.
   - Interaksi penuh: paralaks kursor/sentuhan (~12°), *hover raycast* dengan label objek (`LOGO`, `KEMASAN`, `KALENG`, `CANGKIR`, dll.), klik objek untuk efek pantul *squash-and-stretch* & rotasi warna aksen (atau klik area kosong untuk putaran 360° cincin busur), geser horizontal dengan inersia (`touch-action: pan-y` agar gulir halaman vertikal di ponsel tidak terganggu), tombol keyboard **Ganti warna**, serta fallback otomatis ke `/public/hero-fallback.svg` saat tanpa JS, tanpa WebGL, atau `prefers-reduced-motion` aktif.
2. **BrandMixer (Three.js + OrbitControls + CanvasTexture)**: Kustomisasi kemasan 3D (Box, Kaleng, Cup) dengan nama brand (maks. 18 karakter), 4 gaya visual (*Minimalis*, *Playful*, *Premium*, *Retro*), 6 warna, efek pantul saat objek diklik, dan tautan WhatsApp otomatis berisi pilihan pengguna.
3. **PriceCalc (`#harga`)**: Empat pilihan layanan dengan animasi angka *eased count tween*; saat keempatnya dicentang, muncul harga paket **Rp499.000**, harga lama **Rp715.000** dicoret, serta animasi stempel diskon.
4. **BeforeAfter**: Penggeser perbandingan desain sebelum vs sesudah berbasis *pointer events* yang mendukung layar sentuh dan tombol panah keyboard.
5. **ProcessTimeline**: Linimasa horizontal `scroll-snap` di ponsel dengan penanda ikon busur (*arc-dot*) yang mengikuti progres gulir.
6. **ArcCursor & `v-reveal`**: Kursor cincin khusus desktop yang membesar pada elemen interaktif (disembunyikan di perangkat sentuh) serta direktif animasi muncul berbasis `IntersectionObserver`.

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

Untuk menguji build produksi secara lokal:

```bash
npm run build
npm run preview
```

## Langkah Deploy ke Vercel (Zero-Config)

1. **Push ke GitHub**
   Inisialisasi repositori Git dan unggah ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: website resmi Arc Lab Neo-Brutalist"
   git branch -M main
   git remote add origin https://github.com/USERNAME/arc-lab.git
   git push -u origin main
   ```
2. **Import Repo di Vercel**
   Buka [vercel.com/new](https://vercel.com/new), hubungkan akun GitHub Anda, lalu klik **Import** pada repositori `arc-lab`.
3. **Pastikan Framework Preset: Nuxt.js**
   Vercel otomatis memilih **Framework Preset: Nuxt.js** tanpa perlu mengubah pengaturan apa pun. Klik **Deploy** hingga situs aktif.
