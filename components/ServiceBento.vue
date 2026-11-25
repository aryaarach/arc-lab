<script setup lang="ts">
import { reactive } from 'vue'

const config = useAppConfig()

const services = [
  {
    num: '01',
    code: 'SRV-01',
    title: 'Desain Logo & Identitas',
    price: 'Mulai Rp150.000',
    duration: '2–3 Hari Kerja',
    tintClass: 'bg-sand',
    badgeClass: 'bg-cream/85 text-espresso',
    span: 'lg:col-span-7',
    desc: 'Logo orisinal yang mudah dikenali di papan toko, stiker kemasan, hingga foto profil marketplace dengan karakter hangat dan dewasa.',
    deliverables: [
      '3 Konsep Awal Berbeda',
      'Revisi Terarah 3x',
      'Panduan Warna & Tipografi Singkat',
      'Master AI, EPS, SVG, PDF & PNG Transparan'
    ]
  },
  {
    num: '02',
    code: 'SRV-02',
    title: 'Banner & Spanduk Toko',
    price: 'Mulai Rp99.000',
    duration: '1–2 Hari Kerja',
    tintClass: 'bg-sage-soft',
    badgeClass: 'bg-cream/85 text-sage-deep',
    span: 'lg:col-span-5',
    desc: 'X-Banner bazar, spanduk kedai atau booth pameran, hingga header Shopee & Tokopedia beresolusi tajam.',
    deliverables: [
      'Ukuran Presisi Siap Cetak CMYK',
      'Versi Digital RGB Optimal',
      'Hierarki Harga Mudah Dibaca'
    ]
  },
  {
    num: '03',
    code: 'SRV-03',
    title: 'Kemasan & Mockup 3D',
    price: 'Mulai Rp200.000',
    duration: '3–4 Hari Kerja',
    tintClass: 'bg-butter-soft',
    badgeClass: 'bg-cream/90 text-espresso',
    span: 'lg:col-span-5',
    desc: 'Desain standing pouch, label botol, stiker toples, dan dus produk lengkap dengan pola pisau cetak (dieline) presisi.',
    deliverables: [
      'File Siap Kirim Percetakan',
      'Mockup 3D Realistis untuk Katalog',
      'Tata Letak Barcode, PIRT & Komposisi'
    ]
  },
  {
    num: '04',
    code: 'SRV-04',
    title: 'Feed & Konten Instagram',
    price: 'Mulai Rp250.000',
    duration: '2–4 Hari Kerja',
    tintClass: 'bg-terracotta-soft',
    badgeClass: 'bg-cream/90 text-terracotta-deep',
    span: 'lg:col-span-7',
    desc: '9 sampai 12 desain konten promosi, cerita produk, dan testimoni yang seragam agar profil Instagram bisnismu langsung dipercaya pembeli baru.',
    deliverables: [
      '9 / 12 Konten Siap Unggah',
      'Template Canva / Figma Bisa Diedit Ulang',
      'Kurasi Urutan Grid Estetik',
      'Bonus Sampul Highlight'
    ]
  }
]

const tiltStyles = reactive<Record<string, string>>({})

function onCardPointerMove(code: string, e: PointerEvent) {
  if (e.pointerType === 'touch' || typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  const nx = (e.clientX - rect.left) / rect.width - 0.5
  const ny = (e.clientY - rect.top) / rect.height - 0.5
  const rotX = (-ny * 2.6).toFixed(2)
  const rotY = (nx * 2.6).toFixed(2)
  tiltStyles[code] = `perspective(1100px) translateY(-4px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
}

function onCardPointerLeave(code: string) {
  tiltStyles[code] = ''
}

function makeServiceWa(title: string) {
  const msg = encodeURIComponent(
    `Halo Arc Lab! Saya tertarik dengan layanan *${title}* untuk UMKM saya. Boleh diskusi konsep?`
  )
  return `https://wa.me/${config.whatsappNumber}?text=${msg}`
}
</script>

<template>
  <section id="layanan" class="py-24 sm:py-28 px-4 sm:px-6 lg:px-8 bg-cream">
    <div class="max-w-7xl mx-auto">
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <div class="max-w-xl">
          <p class="editorial-eyebrow text-terracotta-deep mb-3">
            Katalog Studio · Layanan Utama
          </p>
          <h2 class="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-normal tracking-tight leading-[1.06] text-espresso">
            Dirancang khusus untuk kebutuhan nyata UMKM.
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-espresso/75 leading-relaxed">
          Harga transparan tanpa biaya tersembunyi. Seluruh file master diserahkan penuh agar kamu leluasa mencetak kapan saja dan di mana saja.
        </p>
      </div>

      <!-- Asymmetric Editorial Bento Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <article
          v-for="(srv, index) in services"
          :key="srv.code"
          v-reveal="index * 80"
          class="rounded-[26px] border border-espresso/10 shadow-editorial p-7 sm:p-9 flex flex-col justify-between gap-8 transition-all duration-500 ease-editorial hover:shadow-editorial-lg will-change-transform"
          :class="[srv.tintClass, srv.span]"
          :style="tiltStyles[srv.code] ? { transform: tiltStyles[srv.code] } : undefined"
          @pointermove="onCardPointerMove(srv.code, $event)"
          @pointerleave="onCardPointerLeave(srv.code)"
        >
          <div>
            <!-- Top Row: Large Serif Numeral + Duration & Price Pills -->
            <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
              <span
                class="font-display italic font-light text-5xl sm:text-6xl leading-none text-terracotta-deep/85 select-none"
                aria-hidden="true"
              >
                {{ srv.num }}
              </span>

              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="px-3.5 py-1.5 rounded-full border border-espresso/10 text-xs font-medium"
                  :class="srv.badgeClass"
                >
                  {{ srv.duration }}
                </span>
                <span class="px-4 py-1.5 rounded-full bg-espresso text-cream text-xs sm:text-sm font-medium">
                  {{ srv.price }}
                </span>
              </div>
            </div>

            <h3 class="font-display text-2xl sm:text-3xl font-medium tracking-tight text-espresso mb-3">
              {{ srv.title }}
            </h3>
            <p class="text-sm sm:text-base text-espresso/80 leading-relaxed">
              {{ srv.desc }}
            </p>

            <ul class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <li
                v-for="d in srv.deliverables"
                :key="d"
                class="flex items-start gap-2.5 text-xs sm:text-sm text-espresso/85"
              >
                <span
                  class="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-cream/90 border border-espresso/15 text-terracotta-deep text-[10px] font-semibold shrink-0"
                  aria-hidden="true"
                >✓</span>
                <span>{{ d }}</span>
              </li>
            </ul>
          </div>

          <div class="pt-5 border-t border-espresso/10 flex flex-wrap items-center justify-between gap-4">
            <span class="editorial-eyebrow text-espresso/60">
              Gratis Konsultasi Konsep
            </span>
            <a
              :href="makeServiceWa(srv.title)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-full bg-cream hover:bg-espresso text-espresso hover:text-cream border border-espresso/15 px-5 py-2.5 text-sm font-medium transition-all duration-500 ease-editorial shadow-editorial-sm"
            >
              <span>Pesan Layanan</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
