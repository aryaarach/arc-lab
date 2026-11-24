<script setup lang="ts">
import { ref, computed } from 'vue'

const config = useAppConfig()
const mobileOpen = ref(false)

const navItems = [
  { label: 'Layanan', href: '#layanan' },
  { label: 'Mixer 3D', href: '#mixer' },
  { label: 'Transformasi', href: '#transformasi' },
  { label: 'Alur Kerja', href: '#alur' },
  { label: 'Harga', href: '#harga' },
  { label: 'FAQ', href: '#faq' }
]

const waUrl = computed(() => {
  const msg = encodeURIComponent('Halo Arc Lab! Saya ingin konsultasi desain gratis untuk brand UMKM saya.')
  return `https://wa.me/${config.whatsappNumber}?text=${msg}`
})

function closeMenu() {
  mobileOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-paper/95 backdrop-blur-sm border-b-2 border-ink">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
      <!-- Brand Logo -->
      <a
        href="#beranda"
        class="inline-flex items-center gap-2 focus-visible:outline-indigo"
        aria-label="Arc Lab — Kembali ke atas"
        @click="closeMenu"
      >
        <img src="/logo.svg" alt="Logo Arc Lab" width="176" height="45" class="h-11 w-auto" />
      </a>

      <!-- Desktop Navigation -->
      <nav aria-label="Navigasi Utama" class="hidden lg:flex items-center gap-1">
        <a
          v-for="item in navItems"
          :key="item.href"
          :href="item.href"
          class="px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:bg-yellow border-2 border-transparent hover:border-ink transition-colors"
        >
          {{ item.label }}
        </a>
      </nav>

      <!-- Desktop CTA + Mobile Hamburger -->
      <div class="flex items-center gap-3">
        <a
          :href="waUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden sm:inline-flex brutal-btn bg-cyan text-ink px-4 py-2.5 text-sm"
        >
          <span class="w-2 h-2 rounded-full bg-ink animate-pulse" aria-hidden="true"></span>
          <span>Konsultasi Gratis</span>
        </a>

        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-11 h-11 bg-yellow border-2 border-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          :aria-expanded="mobileOpen ? 'true' : 'false'"
          aria-controls="mobile-nav-drawer"
          :aria-label="mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'"
          @click="mobileOpen = !mobileOpen"
        >
          <svg v-if="!mobileOpen" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="square" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="square" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Panel -->
    <div
      v-show="mobileOpen"
      id="mobile-nav-drawer"
      class="lg:hidden border-t-2 border-ink bg-paper px-4 pt-3 pb-5 shadow-brutal"
    >
      <nav aria-label="Navigasi Seluler" class="flex flex-col gap-2">
        <a
          v-for="item in navItems"
          :key="item.href"
          :href="item.href"
          class="px-4 py-3 font-mono text-sm font-bold uppercase border-2 border-ink bg-paper hover:bg-yellow shadow-brutal-sm"
          @click="closeMenu"
        >
          {{ item.label }}
        </a>
        <a
          :href="waUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 brutal-btn bg-cyan text-ink px-5 py-3 text-center text-sm"
          @click="closeMenu"
        >
          Chat WhatsApp Gratis →
        </a>
      </nav>
    </div>
  </header>
</template>
