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
  <footer id="kontak" class="bg-black text-white">
    <!-- Giant Swiss CTA Block -->
    <div class="swiss-container pt-20 sm:pt-28 lg:pt-36 pb-20 sm:pb-28">
      <div v-reveal>
        <div class="h-px w-full bg-white/20 mb-6"></div>
        <p class="swiss-mono text-mid-gray mb-8 flex items-center gap-2.5">
          <span class="inline-block w-2 h-2 rounded-full bg-signal" aria-hidden="true"></span>
          <span>08 / KONTAK — KONSULTASI KONSEP GRATIS</span>
        </p>

        <h2
          class="font-display font-medium text-[54px] sm:text-[84px] lg:text-[116px] xl:text-[140px] tracking-[-0.035em] leading-[0.94] text-white text-left mb-14 sm:mb-20"
        >
          Mulai proyekmu<span class="text-signal">.</span>
        </h2>

        <!-- Large Underlined WhatsApp & Instagram Links from app.config.ts -->
        <div class="swiss-grid gap-y-6">
          <div class="col-span-4 lg:col-span-6">
            <a
              :href="waFooterUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group py-5 border-b border-white/30 hover:border-signal flex items-baseline justify-between gap-4 transition-colors duration-300 ease-out"
            >
              <div class="text-left">
                <span class="swiss-mono text-mid-gray block mb-2">WHATSAPP LANGSUNG</span>
                <span class="font-display text-2xl sm:text-3xl lg:text-4xl font-medium tracking-[-0.025em] text-white group-hover:text-signal transition-colors duration-300">
                  +{{ config.whatsappNumber }}
                </span>
              </div>
              <span class="font-display text-2xl sm:text-3xl text-signal swiss-arrow" aria-hidden="true">↗</span>
            </a>
          </div>

          <div class="col-span-4 lg:col-span-6">
            <a
              :href="instagramUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group py-5 border-b border-white/30 hover:border-signal flex items-baseline justify-between gap-4 transition-colors duration-300 ease-out"
            >
              <div class="text-left">
                <span class="swiss-mono text-mid-gray block mb-2">PORTOFOLIO INSTAGRAM</span>
                <span class="font-display text-2xl sm:text-3xl lg:text-4xl font-medium tracking-[-0.025em] text-white group-hover:text-signal transition-colors duration-300">
                  {{ config.instagramHandle }}
                </span>
              </div>
              <span class="font-display text-2xl sm:text-3xl text-signal swiss-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 12-Col Footer with Small Mono Links & Copyright -->
    <div class="border-t border-white/20 py-10">
      <div class="swiss-container swiss-grid gap-y-8 items-start">
        <div class="col-span-4 lg:col-span-4 text-left space-y-3">
          <a href="#beranda" aria-label="Arc Lab — Kembali ke atas" class="inline-block">
            <img src="/logo-light.svg" alt="Arc Lab" width="140" height="30" class="h-7 w-auto" />
          </a>
          <p class="swiss-mono text-mid-gray leading-relaxed">
            {{ config.location }}
          </p>
        </div>

        <nav
          aria-label="Tautan Footer"
          class="col-span-4 lg:col-span-5 flex flex-wrap gap-x-6 gap-y-3 swiss-mono text-mid-gray"
        >
          <a href="#layanan" class="hover:text-white transition-colors duration-300">01 / LAYANAN</a>
          <a href="#mixer" class="hover:text-white transition-colors duration-300">02 / MIXER</a>
          <a href="#transformasi" class="hover:text-white transition-colors duration-300">03 / KASUS</a>
          <a href="#alur" class="hover:text-white transition-colors duration-300">04 / PROSES</a>
          <a href="#harga" class="hover:text-white transition-colors duration-300">05 / HARGA</a>
          <a href="#faq" class="hover:text-white transition-colors duration-300">07 / FAQ</a>
        </nav>

        <div class="col-span-4 lg:col-span-3 text-left lg:text-right swiss-mono text-mid-gray space-y-2">
          <div>{{ config.email }}</div>
          <div>© 2026 {{ config.studioName }}. HAK CIPTA DILINDUNGI.</div>
        </div>
      </div>
    </div>
  </footer>
</template>
