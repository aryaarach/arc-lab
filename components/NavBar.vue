<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

const config = useAppConfig()
const mobileOpen = ref(false)
const menuTriggerRef = ref<HTMLButtonElement | null>(null)
const mobileSheetRef = ref<HTMLElement | null>(null)

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

function closeMenu(restoreFocus = false) {
  if (!mobileOpen.value) return
  mobileOpen.value = false
  if (restoreFocus) {
    nextTick(() => {
      menuTriggerRef.value?.focus()
    })
  }
}

function getFocusableElements(): HTMLElement[] {
  const root = mobileSheetRef.value
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

function handleDocumentKeydown(e: KeyboardEvent) {
  if (!mobileOpen.value) return

  if (e.key === 'Escape') {
    e.preventDefault()
    closeMenu(true)
    return
  }

  if (e.key === 'Tab') {
    const focusables = getFocusableElements()
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (e.shiftKey) {
      if (active === first || !mobileSheetRef.value?.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else if (active === last || !mobileSheetRef.value?.contains(active)) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(mobileOpen, async (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleDocumentKeydown)
    await nextTick()
    const focusables = getFocusableElements()
    focusables[0]?.focus()
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleDocumentKeydown)
  }
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
  <header class="sticky top-0 z-50 w-full pt-3 sm:pt-4 px-4 sm:px-6 lg:px-8 pointer-events-none">
    <div
      class="pointer-events-auto max-w-6xl mx-auto h-16 sm:h-[4.25rem] px-4 sm:px-6 rounded-full bg-cream/85 backdrop-blur-md border border-espresso/10 shadow-editorial flex items-center justify-between gap-4 transition-all duration-500 ease-editorial"
    >
      <!-- Left: Brand Logo -->
      <a
        href="#beranda"
        class="inline-flex items-center rounded-full py-1 shrink-0"
        aria-label="Arc Lab — Kembali ke atas"
        @click="closeMenu(false)"
      >
        <img src="/logo.svg" alt="Logo Arc Lab" width="168" height="41" class="h-9 sm:h-10 w-auto" />
      </a>

      <!-- Center: Desktop Navigation Links -->
      <nav aria-label="Navigasi Utama" class="hidden lg:flex items-center justify-center gap-1">
        <a
          v-for="item in navItems"
          :key="item.href"
          :href="item.href"
          class="px-3.5 py-2 rounded-full text-sm font-medium text-espresso/80 hover:text-espresso hover:bg-sand/75 transition-colors duration-300 ease-editorial"
        >
          {{ item.label }}
        </a>
      </nav>

      <!-- Right: Terracotta Pill CTA + Mobile Trigger -->
      <div class="flex items-center gap-2.5 shrink-0">
        <a
          :href="waUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden sm:inline-flex items-center gap-2 rounded-full bg-terracotta-deep bg-gradient-to-b from-terracotta to-terracotta-deep text-cream px-5 py-2.5 text-sm font-medium shadow-editorial-sm hover:from-espresso hover:to-espresso hover:-translate-y-0.5 transition-all duration-500 ease-editorial"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-butter" aria-hidden="true"></span>
          <span>Konsultasi</span>
        </a>

        <button
          ref="menuTriggerRef"
          type="button"
          class="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full bg-sand/85 text-espresso border border-espresso/10 hover:bg-sand transition-colors duration-300 ease-editorial"
          :aria-expanded="mobileOpen ? 'true' : 'false'"
          aria-controls="mobile-nav-sheet"
          :aria-label="mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'"
          @click="mobileOpen = !mobileOpen"
        >
          <svg
            v-if="!mobileOpen"
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path stroke-linecap="round" d="M4 7.5h16M4 12h16M4 16.5h16" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path stroke-linecap="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Sheet Menu with Focus Trap -->
    <Transition
      enter-active-class="transition-opacity duration-500 ease-editorial"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300 ease-editorial"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="pointer-events-auto lg:hidden fixed inset-0 z-50 bg-espresso/35 backdrop-blur-sm flex items-end sm:items-start sm:justify-end p-4"
        @click.self="closeMenu(true)"
      >
        <div
          id="mobile-nav-sheet"
          ref="mobileSheetRef"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi seluler"
          class="w-full sm:max-w-sm rounded-[28px] bg-cream border border-espresso/10 shadow-editorial-lg p-6 flex flex-col gap-5"
        >
          <div class="flex items-center justify-between pb-4 border-b border-espresso/10">
            <img src="/logo.svg" alt="Logo Arc Lab" width="148" height="36" class="h-8 w-auto" />
            <button
              type="button"
              class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sand text-espresso border border-espresso/10 hover:bg-terracotta/15 transition-colors"
              aria-label="Tutup menu navigasi"
              @click="closeMenu(true)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path stroke-linecap="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          <nav aria-label="Navigasi Seluler" class="flex flex-col gap-1.5">
            <a
              v-for="item in navItems"
              :key="item.href"
              :href="item.href"
              class="px-4 py-3 rounded-2xl font-display text-xl text-espresso hover:bg-sand/80 transition-colors flex items-center justify-between"
              @click="closeMenu(false)"
            >
              <span>{{ item.label }}</span>
              <span class="text-terracotta text-base" aria-hidden="true">→</span>
            </a>
          </nav>

          <div class="pt-3 border-t border-espresso/10 flex flex-col gap-2.5">
            <a
              :href="waUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full pill-btn-primary px-6 py-3.5 text-center text-sm"
              @click="closeMenu(false)"
            >
              <span>Konsultasi via WhatsApp</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>
