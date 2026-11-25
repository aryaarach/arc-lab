<script setup lang="ts">
import { computed } from 'vue'

const config = useAppConfig()

const waFooterUrl = computed(() => {
  const msg = encodeURIComponent('Halo Arc Lab! Saya ingin diskusi konsep desain gratis untuk usaha saya.')
  return `https://wa.me/${config.whatsappNumber}?text=${msg}`
})

const instagramUrl = computed(() => {
  const cleanHandle = String(config.instagramHandle || '@arclab.studio').replace(/^@/, '')
  return `https://instagram.com/${cleanHandle}`
})
</script>

<template>
  <footer id="kontak" class="bg-espresso text-cream relative overflow-hidden">
    <!-- Subtle Warm Terracotta Radial Glow -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -top-40 right-1/4 w-[42rem] h-[42rem] rounded-full bg-terracotta/15 blur-3xl"
    ></div>

    <!-- Giant Serif Editorial CTA Section -->
    <div class="relative px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
      <div v-reveal class="max-w-7xl mx-auto">
        <p class="editorial-eyebrow text-butter mb-5 flex items-center gap-2.5">
          <span class="w-2 h-2 rounded-full bg-terracotta" aria-hidden="true"></span>
          <span>Konsultasi Desain Gratis · {{ config.location }}</span>
        </p>

        <h2 class="font-display text-4xl sm:text-6xl lg:text-[4.5rem] xl:text-[5.25rem] font-normal tracking-[-0.025em] leading-[1.03] max-w-5xl text-cream">
          Siap membuat produk UMKM-mu tampil
          <span class="italic text-butter">meyakinkan</span>
          minggu ini?
        </h2>

        <p class="mt-6 max-w-xl text-base sm:text-lg text-cream/75 leading-relaxed">
          Mari berbincang santai lewat WhatsApp. Gratis pemetaan konsep warna dan arah kemasan tanpa komitmen pemesanan di awal.
        </p>

        <div class="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <a
            :href="waFooterUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2.5 rounded-full bg-terracotta-deep bg-gradient-to-b from-terracotta to-terracotta-deep text-cream px-8 py-4 text-base font-medium shadow-editorial hover:from-butter hover:to-butter hover:text-espresso hover:-translate-y-0.5 transition-all duration-500 ease-editorial"
          >
            <span>Chat WhatsApp Sekarang</span>
            <span aria-hidden="true">→</span>
          </a>
          <a
            :href="instagramUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-cream/8 hover:bg-cream/15 text-cream border border-cream/20 px-8 py-4 text-base font-medium hover:-translate-y-0.5 transition-all duration-500 ease-editorial"
          >
            <span>Portofolio {{ config.instagramHandle }}</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Hairline Bottom Studio Footer Bar -->
    <div class="relative border-t border-cream/10 px-4 sm:px-6 lg:px-8 py-10">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <a href="#beranda" class="inline-block mb-3" aria-label="Arc Lab — Kembali ke atas">
            <img src="/logo-light.svg" alt="Logo Arc Lab" width="160" height="39" class="h-9 w-auto" />
          </a>
          <p class="text-xs sm:text-sm text-cream/65 max-w-sm leading-relaxed">
            Studio desain identitas dan kemasan produk untuk pelaku UMKM di seluruh Indonesia. Hangat, presisi, dan siap cetak.
          </p>
        </div>

        <nav aria-label="Tautan Footer" class="flex flex-wrap gap-x-7 gap-y-3 text-xs sm:text-sm text-cream/75">
          <a href="#layanan" class="hover:text-butter transition-colors">Layanan</a>
          <a href="#mixer" class="hover:text-butter transition-colors">Mixer 3D</a>
          <a href="#transformasi" class="hover:text-butter transition-colors">Studi Kasus</a>
          <a href="#alur" class="hover:text-butter transition-colors">Alur Kerja</a>
          <a href="#harga" class="hover:text-butter transition-colors">Harga</a>
          <a href="#faq" class="hover:text-butter transition-colors">FAQ</a>
        </nav>

        <div class="text-xs text-cream/65 md:text-right space-y-1">
          <div>WhatsApp: +{{ config.whatsappNumber }}</div>
          <div>Instagram: {{ config.instagramHandle }}</div>
          <div class="text-cream/45 pt-1">© 2026 {{ config.studioName }}. Hak cipta dilindungi.</div>
        </div>
      </div>
    </div>
  </footer>
</template>
