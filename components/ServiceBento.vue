<script setup lang="ts">
const config = useAppConfig()

const services = [
  {
    idx: '01',
    code: 'SRV-01',
    title: 'Desain Logo & Identitas',
    price: 'Mulai Rp150.000',
    duration: '2–3 Hari',
    span: 'lg:col-span-7',
    desc: 'Logo orisinal yang presisi di papan toko, stiker kemasan, hingga foto profil marketplace.',
    deliverables: '3 KONSEP AWAL · REVISI 3X · PANDUAN WARNA & FONT · MASTER AI/EPS/SVG/PDF/PNG'
  },
  {
    idx: '02',
    code: 'SRV-02',
    title: 'Banner & Spanduk Toko',
    price: 'Mulai Rp99.000',
    duration: '1–2 Hari',
    span: 'lg:col-span-5',
    desc: 'X-Banner bazar, spanduk booth, dan header marketplace beresolusi tajam yang mudah dibaca.',
    deliverables: 'CETAK CMYK PRESISI · VERSI DIGITAL RGB · HIERARKI HARGA JELAS'
  },
  {
    idx: '03',
    code: 'SRV-03',
    title: 'Kemasan & Mockup 3D',
    price: 'Mulai Rp200.000',
    duration: '3–4 Hari',
    span: 'lg:col-span-5',
    desc: 'Desain standing pouch, label botol, toples, dan dus produk lengkap dengan pola pisau cetak.',
    deliverables: 'DIELINE SIAP CETAK · MOCKUP 3D KATALOG · SLOT BARCODE, PIRT & HALAL'
  },
  {
    idx: '04',
    code: 'SRV-04',
    title: 'Feed & Konten Instagram',
    price: 'Mulai Rp250.000',
    duration: '2–4 Hari',
    span: 'lg:col-span-7',
    desc: 'Sistem 9–12 konten promosi, edukasi produk, dan testimoni seragam agar profil bisnis dipercaya.',
    deliverables: '9–12 KONTEN SIAP UNGGAH · TEMPLATE CANVA/FIGMA · COVER HIGHLIGHT'
  }
]

function makeServiceWa(title: string) {
  const msg = encodeURIComponent(`Halo Arc Lab! Saya tertarik dengan layanan *${title}* untuk UMKM saya. Boleh diskusi konsep?`)
  return `https://wa.me/${config.whatsappNumber}?text=${msg}`
}
</script>

<template>
  <section id="layanan" class="py-20 sm:py-28 lg:py-32 bg-white">
    <div class="swiss-container">
      <!-- Numbered Swiss Section Header with 1px Draw-In Rule -->
      <div v-reveal class="mb-14 sm:mb-16">
        <div class="swiss-section-rule mb-5"></div>
        <div class="swiss-grid gap-y-6 items-end">
          <div class="col-span-4 lg:col-span-2">
            <span class="swiss-mono text-signal">01 / LAYANAN</span>
          </div>
          <div class="col-span-4 lg:col-span-6">
            <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[0.98] text-black text-left">
              Sistem desain fokus UMKM.
            </h2>
          </div>
          <div class="col-span-4 lg:col-span-4">
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed text-left">
              Harga transparan tanpa biaya tersembunyi. Seluruh file master diserahkan penuh agar bebas dicetak di mana saja.
            </p>
          </div>
        </div>
      </div>

      <!-- Strict Modular Grid with 1px Dividers & Black Hover Inversion -->
      <div class="border-t border-l border-line grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
        <article
          v-for="(srv, index) in services"
          :key="srv.code"
          v-reveal="index * 60"
          class="group border-r border-b border-line bg-white hover:bg-black text-black hover:text-white transition-colors duration-300 ease-out p-7 sm:p-10 lg:p-12 flex flex-col justify-between gap-10"
          :class="srv.span"
        >
          <div>
            <!-- Top Row: Large Index Numeral + Mono Price/Duration -->
            <div class="flex items-start justify-between gap-4 mb-8">
              <span class="font-display text-5xl sm:text-6xl font-medium tracking-[-0.04em] leading-none text-black group-hover:text-signal transition-colors duration-300">
                {{ srv.idx }}
              </span>
              <div class="text-right swiss-mono text-dark-gray group-hover:text-mid-gray transition-colors duration-300 space-y-1.5">
                <div class="text-black group-hover:text-white font-semibold">{{ srv.price }}</div>
                <div>{{ srv.duration }}</div>
              </div>
            </div>

            <!-- Grotesk Service Title + One-Line Ragged-Right Description -->
            <h3 class="font-display text-2xl sm:text-3xl font-medium tracking-[-0.03em] leading-tight mb-3 text-left">
              {{ srv.title }}
            </h3>
            <p class="text-sm sm:text-base text-dark-gray group-hover:text-white/80 leading-relaxed text-left max-w-xl transition-colors duration-300">
              {{ srv.desc }}
            </p>
          </div>

          <!-- Bottom Hairline Rule + Mono Deliverables + Small "↗" Link -->
          <div class="pt-5 border-t border-line group-hover:border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300">
            <span class="swiss-mono text-dark-gray group-hover:text-mid-gray leading-relaxed">
              {{ srv.deliverables }}
            </span>

            <a
              :href="makeServiceWa(srv.title)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 shrink-0 font-sans text-sm font-medium tracking-[-0.01em] text-black group-hover:text-white transition-colors duration-300"
            >
              <span>Pesan</span>
              <span class="swiss-arrow text-signal" aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
