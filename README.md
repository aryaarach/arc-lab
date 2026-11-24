# Arc Lab — Studio Desain Grafis & Kemasan UMKM

Website resmi **Arc Lab** dengan tema **Neo-Brutalist Lab**, dibangun menggunakan **Nuxt 3 (Vue 3 `<script setup>`)**, **Tailwind CSS**, dan **Three.js**. Dirancang ringan, aksesibel, berbahasa Indonesia penuh, dan siap di-deploy ke **Vercel tanpa konfigurasi tambahan (zero-config)**.

## Fitur Interaktif Utama

1. **HeroScene (Three.js)**: 1.800 partikel interaktif yang menolak kursor dan kembali ke posisi semula, cincin busur parsial (`TorusGeometry`) + ikosahedron wireframe, efek ledakan warna saat diklik, penghentian otomatis render loop saat di luar layar (`IntersectionObserver`), serta gambar fallback statis jika WebGL tidak tersedia atau `prefers-reduced-motion` aktif.
2. **BrandMixer (Three.js + OrbitControls + CanvasTexture)**: Kustomisasi kemasan 3D interaktif (Box, Kaleng, Cup) dengan input nama brand (maks. 18 karakter), 4 gaya visual (*Minimalis*, *Playful*, *Premium*, *Retro*), 6 pilihan warna, efek pantul saat objek diklik, dan tombol WhatsApp yang otomatis mengisi pilihan pengguna.
3. **PriceCalc**: Kalkulator 4 layanan dengan animasi angka *eased tween*, harga coret `Rp715.000`, harga spesial **Paket Kombo `Rp499.000`**, serta animasi stempel otomatis ketika keempat layanan dicentang.
4. **BeforeAfter**: Penggeser perbandingan desain sebelum vs sesudah berbasis *pointer events* (ramah layar sentuh) dan mendukung navigasi tombol panah pada keyboard.
5. **ProcessTimeline**: Linimasa horizontal `scroll-snap` di perangkat seluler dengan penanda ikon busur (*arc-dot*) yang mengikuti progres gulir.
6. **ArcCursor & `v-reveal`**: Kursor cincin khusus desktop yang membesar pada elemen interaktif (otomatis disembunyikan di layar sentuh) dan direktif animasi gulir ringan berbasis `IntersectionObserver`.

## Konfigurasi Kontak terpusat

Ubah nomor WhatsApp dan akun Instagram studio cukup di satu file [`app.config.ts`](./app.config.ts):

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

Pastikan Node.js (versi 18.x atau lebih baru) sudah terpasang, lalu jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di peramban untuk melihat hasilnya.

Untuk menguji hasil build produksi secara lokal:

```bash
npm run build
npm run preview
```

## Cara Deploy ke Vercel (Zero-Config)

Proyek ini tidak menggunakan fitur khusus server (*server-only*) sehingga dapat langsung di-deploy ke Vercel tanpa file `vercel.json` atau pengaturan tambahan:

1. **Push ke GitHub**
   Buat repositori baru di GitHub, lalu unggah kode proyek:
   ```bash
   git init
   git add .
   git commit -m "feat: rilis website Arc Lab Neo-Brutalist"
   git branch -M main
   git remote add origin https://github.com/USERNAME/arc-lab.git
   git push -u origin main
   ```
2. **Import Repo di Vercel**
   Masuk ke [vercel.com/new](https://vercel.com/new) dan pilih **Import** pada repositori `arc-lab` yang baru diunggah.
3. **Pastikan Framework Preset: Nuxt.js**
   Vercel akan otomatis mendeteksi **Framework Preset: Nuxt.js** (`Build Command`: `nuxt build`, `Output Directory`: `.output`). Klik **Deploy** dan situs siap diakses publik dalam ~1 menit.
