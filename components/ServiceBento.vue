<script setup lang="ts">
const config = useAppConfig()

const services = [
  {
    code: 'SRV-01',
    title: 'Desain Logo & Identitas',
    price: 'Mulai Rp150.000',
    duration: '2–3 Hari',
    bg: 'bg-yellow',
    span: 'lg:col-span-7',
    desc: 'Logo orisinal yang mudah dikenali di papan toko, stiker kemasan, hingga foto profil marketplace.',
    deliverables: ['3 Konsep Awal Berbeda', 'Revisi Terarah 3x', 'Panduan Warna & Font Singkat', 'Master AI, EPS, SVG, PDF & PNG Transparan']
  },
  {
    code: 'SRV-02',
    title: 'Banner & Spanduk Toko',
    price: 'Mulai Rp99.000',
    duration: '1–2 Hari',
    bg: 'bg-cyan',
    span: 'lg:col-span-5',
    desc: 'X-Banner bazar, spanduk warung/booth, hingga header Shopee & Tokopedia beresolusi tajam.',
    deliverables: ['Ukuran Presisi Siap Cetak CMYK', 'Versi Digital RGB', 'Tata Letak Harga Mudah Dibaca']
  },
  {
    code: 'SRV-03',
    title: 'Kemasan & Mockup 3D',
    price: 'Mulai Rp200.000',
    duration: '3–4 Hari',
    bg: 'bg-paper',
    accentBadge: 'bg-coral text-paper',
    span: 'lg:col-span-5',
    desc: 'Desain standing pouch, label botol, stiker toples, dan dus produk lengkap dengan pola pisau cetak (dieline).',
    deliverables: ['File Siap Kirim Percetakan', 'Mockup 3D Realistis untuk Katalog', 'Slot Barcode, PIRT & Komposisi Rapi']
  },
  {
    code: 'SRV-04',
    title: 'Feed & Konten Instagram',
    price: 'Mulai Rp250.000',
    duration: '2–4 Hari',
    bg: 'bg-indigo text-paper',
    isDark: true,
    span: 'lg:col-span-7',
    desc: '9 sampai 12 desain konten promosi, edukasi produk, dan testimoni yang seragam agar profil Instagram bisnismu dipercaya pembeli baru.',
    deliverables: ['9 / 12 Konten Siap Unggah', 'Template Canva / Figma Bisa Diedit Ulang', 'Rekomendasi Urutan Grid Estetik', 'Bonus Cover Highlight']
  }
]

function makeServiceWa(title: string) {
  const msg = encodeURIComponent(`Halo Arc Lab! Saya tertarik dengan layanan *${title}* untuk UMKM saya. Boleh diskusi konsep?`)
  return `https://wa.me/${config.whatsappNumber}?text=${msg}`
}
</script>

<template>
  <section id="layanan" class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper">
    <div class="max-w-7xl mx-auto">
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <span class="brutal-tag bg-yellow text-ink mb-3">KATALOG STUDIO // LAB 01</span>
          <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Layanan Desain Fokus UMKM
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-ink/80">
          Harga transparan tanpa biaya tersembunyi. Semua file master diberikan penuh agar kamu bebas cetak di mana saja.
        </p>
      </div>

      <!-- Neo-Brutalist Bento Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <article
          v-for="(srv, index) in services"
          :key="srv.code"
          v-reveal="index * 70"
          class="border-2 border-ink shadow-brutal p-6 sm:p-8 flex flex-col justify-between gap-6 transition-transform duration-200 hover:-translate-y-1"
          :class="[srv.bg, srv.span]"
        >
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span
                class="px-2.5 py-1 border-2 border-ink font-mono text-xs font-bold uppercase"
                :class="srv.isDark ? 'bg-yellow text-ink' : (srv.accentBadge || 'bg-paper text-ink')"
              >
                {{ srv.code }} · {{ srv.duration }}
              </span>
              <span
                class="px-3 py-1 border-2 border-ink font-mono text-sm font-bold"
                :class="srv.isDark ? 'bg-cyan text-ink' : 'bg-ink text-paper'"
              >
                {{ srv.price }}
              </span>
            </div>

            <h3 class="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              {{ srv.title }}
            </h3>
            <p class="text-sm sm:text-base leading-relaxed" :class="srv.isDark ? 'text-paper/90' : 'text-ink/85'">
              {{ srv.desc }}
            </p>

            <ul class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <li
                v-for="d in srv.deliverables"
                :key="d"
                class="flex items-start gap-2 text-xs sm:text-sm font-medium"
              >
                <span
                  class="mt-0.5 inline-flex items-center justify-center w-4 h-4 border border-ink font-mono text-[10px] font-bold shrink-0"
                  :class="srv.isDark ? 'bg-yellow text-ink border-paper' : 'bg-paper text-ink'"
                  aria-hidden="true"
                >✓</span>
                <span>{{ d }}</span>
              </li>
            </ul>
          </div>

          <div class="pt-4 border-t-2 flex items-center justify-between gap-4" :class="srv.isDark ? 'border-paper/30' : 'border-ink'">
            <span class="font-mono text-xs uppercase tracking-wider" :class="srv.isDark ? 'text-paper/80' : 'text-ink/75'">
              Gratis Konsultasi Konsep
            </span>
            <a
              :href="makeServiceWa(srv.title)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-ink font-display font-bold text-sm shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform"
              :class="srv.isDark ? 'bg-yellow text-ink' : 'bg-paper hover:bg-yellow text-ink'"
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
