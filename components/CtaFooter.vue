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
  <footer id="kontak" class="bg-ink text-paper">
    <!-- High-Impact Neo-Brutalist Final CTA Banner -->
    <div class="px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-14">
      <div
        v-reveal
        class="max-w-7xl mx-auto bg-yellow text-ink border-2 border-paper shadow-brutal-white p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8"
      >
        <div class="max-w-2xl">
          <span class="inline-flex items-center gap-2 px-3 py-1 bg-ink text-paper font-mono text-xs font-bold uppercase tracking-wider mb-4">
            <span class="w-2 h-2 rounded-full bg-cyan animate-ping" aria-hidden="true"></span>
            KONSULTAN DESAIN ONLINE
          </span>
          <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Siap bikin produk UMKM-mu tampil meyakinkan minggu ini?
          </h2>
          <p class="mt-3 text-base sm:text-lg text-ink/85">
            Ngobrol santai dulu lewat WhatsApp. Gratis pemetaan konsep visual tanpa paksaan order.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row lg:flex-col gap-3.5 w-full lg:w-auto shrink-0">
          <a
            :href="waFooterUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="brutal-btn bg-indigo text-paper px-7 py-4 text-base sm:text-lg text-center"
          >
            <span>Chat WhatsApp Sekarang</span>
            <span aria-hidden="true">→</span>
          </a>
          <a
            :href="instagramUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="brutal-btn bg-paper text-ink px-7 py-3.5 text-sm text-center"
          >
            Lihat Portofolio {{ config.instagramHandle }}
          </a>
        </div>
      </div>
    </div>

    <!-- Bottom Studio Info Bar -->
    <div class="border-t-2 border-paper/20 px-4 sm:px-6 lg:px-8 py-10">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <div class="inline-block bg-paper px-3 py-1.5 border-2 border-paper mb-3">
            <img src="/logo.svg" alt="Logo Arc Lab" width="154" height="40" class="h-9 w-auto" />
          </div>
          <p class="text-sm text-paper/75 max-w-sm">
            Studio desain grafis dan identitas kemasan untuk pelaku UMKM di seluruh Indonesia. Cepat, rapi, dan siap cetak.
          </p>
        </div>

        <div class="flex flex-wrap gap-x-8 gap-y-4 font-mono text-xs uppercase tracking-wider">
          <a href="#layanan" class="hover:text-yellow transition-colors">Layanan</a>
          <a href="#mixer" class="hover:text-yellow transition-colors">3D Mixer</a>
          <a href="#transformasi" class="hover:text-yellow transition-colors">Studi Kasus</a>
          <a href="#harga" class="hover:text-yellow transition-colors">Harga</a>
          <a href="#faq" class="hover:text-yellow transition-colors">FAQ</a>
        </div>

        <div class="font-mono text-xs text-paper/75 md:text-right space-y-1">
          <div>WhatsApp: +{{ config.whatsappNumber }}</div>
          <div>Instagram: {{ config.instagramHandle }}</div>
          <div class="text-paper/55 pt-1">© 2026 {{ config.studioName }}. Hak cipta dilindungi.</div>
        </div>
      </div>
    </div>
  </footer>
</template>
