<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

const config = useAppConfig()
const mobileOpen = ref(false)
const menuDialogRef = ref<HTMLElement | null>(null)
const menuCloseBtnRef = ref<HTMLButtonElement | null>(null)
const menuOpenBtnRef = ref<HTMLButtonElement | null>(null)

const navItems = [
  { idx: '01', label: 'Layanan', href: '#layanan' },
  { idx: '02', label: 'Mixer', href: '#mixer' },
  { idx: '03', label: 'Proses', href: '#alur' },
  { idx: '04', label: 'Harga', href: '#harga' }
]

const secondaryMobileItems = [
  { idx: '05', label: 'Studi Kasus', href: '#transformasi' },
  { idx: '06', label: 'Testimoni', href: '#testimoni' },
  { idx: '07', label: 'FAQ', href: '#faq' }
]

const waUrl = computed(() => {
  const msg = encodeURIComponent('Halo Arc Lab! Saya ingin konsultasi desain gratis untuk brand UMKM saya.')
  return `https://wa.me/${config.whatsappNumber}?text=${msg}`
})

function openMenu() {
  mobileOpen.value = true
}

function closeMenu(restoreFocus = false) {
  if (!mobileOpen.value) return
  mobileOpen.value = false
  if (restoreFocus) {
    nextTick(() => {
      menuOpenBtnRef.value?.focus()
    })
  }
}

function onDialogKeydown(e: KeyboardEvent) {
  if (!mobileOpen.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    closeMenu(true)
    return
  }
  if (e.key !== 'Tab') return

  const root = menuDialogRef.value
  if (!root) return
  const focusables = Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)

  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(mobileOpen, async (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    menuCloseBtnRef.value?.focus()
  } else {
    document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-white border-b border-line">
    <div class="swiss-container">
      <div class="swiss-grid items-center h-16 md:h-20">
        <!-- Cols 1-3: Brand Logo -->
        <div class="col-span-2 lg:col-span-3 flex items-center">
          <a
            href="#beranda"
            class="inline-flex items-center py-1"
            aria-label="Arc Lab — Kembali ke atas"
            @click="closeMenu(false)"
          >
            <img src="/logo.svg" alt="Arc Lab" width="148" height="32" class="h-7 sm:h-8 w-auto" />
          </a>
        </div>

        <!-- Cols 4-9: Indexed Swiss Links -->
        <nav
          aria-label="Navigasi Utama"
          class="hidden lg:grid lg:col-span-6 lg:grid-cols-4 gap-x-6 items-center"
        >
          <a
            v-for="item in navItems"
            :key="item.href"
            :href="item.href"
            class="group inline-flex items-baseline gap-2 py-2 text-left transition-colors duration-300 ease-out"
          >
            <span class="swiss-mono text-dark-gray group-hover:text-signal transition-colors duration-300">
              {{ item.idx }}
            </span>
            <span class="text-sm font-medium tracking-[-0.02em] text-black group-hover:text-signal transition-colors duration-300">
              {{ item.label }}
            </span>
          </a>
        </nav>

        <!-- Cols 10-12: Rectangular Black CTA + Mobile Trigger -->
        <div class="col-span-2 lg:col-span-3 flex items-center justify-end gap-3">
          <a
            :href="waUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="hidden sm:inline-flex group swiss-btn-primary px-5 py-2.5 text-sm"
          >
            <span>Konsultasi</span>
            <span class="swiss-arrow" aria-hidden="true">↗</span>
          </a>

          <button
            ref="menuOpenBtnRef"
            type="button"
            class="lg:hidden inline-flex items-center gap-2.5 px-3.5 py-2 rounded-none border border-black bg-white text-black swiss-mono hover:bg-black hover:text-white transition-colors duration-300 ease-out"
            :aria-expanded="mobileOpen ? 'true' : 'false'"
            aria-controls="mobile-nav-drawer"
            aria-label="Buka menu navigasi"
            @click="openMenu"
          >
            <span>Menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              stroke-width="1.4"
              aria-hidden="true"
            >
              <line x1="1" y1="5" x2="15" y2="5" />
              <line x1="1" y1="11" x2="15" y2="11" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Full-Screen Black Menu with Huge Type & Focus Trap -->
    <Teleport to="body">
      <div
        v-if="mobileOpen"
        id="mobile-nav-drawer"
        ref="menuDialogRef"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi seluler"
        class="fixed inset-0 z-[90] bg-black text-white flex flex-col justify-between overflow-y-auto"
        @keydown="onDialogKeydown"
      >
        <!-- Top Bar inside Full-Screen Menu -->
        <div class="border-b border-white/15">
          <div class="swiss-container flex items-center justify-between h-16 md:h-20">
            <a
              href="#beranda"
              aria-label="Arc Lab — Kembali ke atas"
              class="inline-flex items-center py-1"
              @click="closeMenu(false)"
            >
              <img src="/logo-light.svg" alt="Arc Lab" width="148" height="32" class="h-7 sm:h-8 w-auto" />
            </a>

            <button
              ref="menuCloseBtnRef"
              type="button"
              class="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-none border border-white text-white swiss-mono hover:bg-signal hover:border-signal transition-colors duration-300 ease-out"
              aria-label="Tutup menu navigasi"
              @click="closeMenu(true)"
            >
              <span>Tutup</span>
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        <!-- Huge Grotesk Links -->
        <nav aria-label="Navigasi Seluler" class="swiss-container py-8 flex-1 flex flex-col justify-center">
          <ul class="border-t border-white/15">
            <li
              v-for="item in navItems"
              :key="item.href"
              class="border-b border-white/15"
            >
              <a
                :href="item.href"
                class="group py-4 sm:py-5 flex items-baseline justify-between gap-4 text-left transition-colors duration-300 ease-out"
                @click="closeMenu(false)"
              >
                <div class="flex items-baseline gap-4">
                  <span class="swiss-mono text-signal">{{ item.idx }}</span>
                  <span class="font-display text-5xl sm:text-6xl font-medium tracking-[-0.03em] leading-none text-white group-hover:text-signal transition-colors duration-300">
                    {{ item.label }}
                  </span>
                </div>
                <span class="text-2xl text-mid-gray group-hover:text-signal swiss-arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          </ul>

          <div class="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            <a
              v-for="sub in secondaryMobileItems"
              :key="sub.href"
              :href="sub.href"
              class="swiss-mono text-mid-gray hover:text-white transition-colors duration-300"
              @click="closeMenu(false)"
            >
              {{ sub.idx }} / {{ sub.label }}
            </a>
          </div>
        </nav>

        <!-- Bottom CTA Bar -->
        <div class="border-t border-white/15 py-6">
          <div class="swiss-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p class="swiss-mono text-mid-gray">
              ARC LAB / STUDIO DESAIN UMKM / INDONESIA
            </p>
            <a
              :href="waUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group inline-flex items-center justify-between sm:justify-center gap-3 px-6 py-4 rounded-none border border-signal bg-signal text-white font-sans font-medium text-base tracking-[-0.02em] hover:bg-white hover:border-white hover:text-black transition-colors duration-300 ease-out"
              @click="closeMenu(false)"
            >
              <span>Konsultasi via WhatsApp</span>
              <span class="swiss-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>
