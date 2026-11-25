<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

interface CalcItem {
  id: string
  name: string
  detail: string
  price: number
  pillTint: string
}

const config = useAppConfig()

// Individual sum = 150.000 + 115.000 + 200.000 + 250.000 = Rp715.000
const items: CalcItem[] = [
  {
    id: 'logo',
    name: 'Desain Logo & Palet Brand',
    detail: '3 konsep awal · 3x revisi · Master AI/EPS/SVG/PNG',
    price: 150000,
    pillTint: 'bg-sand text-espresso'
  },
  {
    id: 'banner',
    name: 'Banner Cetak & Header Toko',
    detail: 'Spanduk kedai/booth CMYK + header marketplace',
    price: 115000,
    pillTint: 'bg-sage-soft text-espresso'
  },
  {
    id: 'kemasan',
    name: 'Desain Kemasan + Mockup 3D',
    detail: 'Standing pouch / dus / label siap kirim percetakan',
    price: 200000,
    pillTint: 'bg-butter-soft text-espresso'
  },
  {
    id: 'feed',
    name: 'Paket 9 Konten Feed Instagram',
    detail: 'Grid rapi seragam + file template mudah diedit ulang',
    price: 250000,
    pillTint: 'bg-terracotta-soft text-espresso'
  }
]

const BUNDLE_PRICE = 499000
const FULL_SUM_PRICE = 715000

const selectedIds = ref<string[]>(['logo', 'kemasan'])
const displayedTotal = ref(350000)
const ribbonKey = ref(0)

const isBundleActive = computed(() => selectedIds.value.length === items.length)

const rawSubtotal = computed(() =>
  items
    .filter((it) => selectedIds.value.includes(it.id))
    .reduce((acc, it) => acc + it.price, 0)
)

const targetTotal = computed(() => (isBundleActive.value ? BUNDLE_PRICE : rawSubtotal.value))

let tweenRaf = 0

function animateTotal(toValue: number) {
  if (typeof window === 'undefined') {
    displayedTotal.value = toValue
    return
  }
  window.cancelAnimationFrame(tweenRaf)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayedTotal.value = toValue
    return
  }

  const fromValue = displayedTotal.value
  const diff = toValue - fromValue
  if (diff === 0) return

  const duration = 560
  const startTime = performance.now()

  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / duration)
    // Cubic ease-out
    const eased = 1 - Math.pow(1 - t, 3)
    displayedTotal.value = Math.round(fromValue + diff * eased)
    if (t < 1) {
      tweenRaf = window.requestAnimationFrame(step)
    } else {
      displayedTotal.value = toValue
    }
  }

  tweenRaf = window.requestAnimationFrame(step)
}

watch(targetTotal, (nextVal) => {
  animateTotal(nextVal)
})

watch(isBundleActive, (active) => {
  if (active) {
    ribbonKey.value++
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.cancelAnimationFrame(tweenRaf)
  }
})

function formatRp(amount: number) {
  return `Rp${new Intl.NumberFormat('id-ID').format(amount)}`
}

function selectAllBundle() {
  selectedIds.value = items.map((i) => i.id)
}

const waCalcUrl = computed(() => {
  const chosen = items.filter((it) => selectedIds.value.includes(it.id))
  if (chosen.length === 0) {
    return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent('Halo Arc Lab! Saya ingin tanya paket desain untuk UMKM saya.')}`
  }
  const lines = chosen.map((c) => `• ${c.name} (${formatRp(c.price)})`).join('\n')
  const summary = isBundleActive.value
    ? `\n*Paket Kombo Branding UMKM Aktif!*\nHarga Normal: ~${formatRp(FULL_SUM_PRICE)}~\n*Total Hemat: ${formatRp(BUNDLE_PRICE)}*`
    : `\n*Estimasi Total: ${formatRp(targetTotal.value)}*`

  const text = `Halo Arc Lab! Saya sudah menghitung kebutuhan desain di *Kalkulator Harga*:\n${lines}\n${summary}\n\nMohon info jadwal slot pengerjaan terdekat ya!`
  return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(text)}`
})
</script>

<template>
  <section id="harga" class="py-24 sm:py-28 px-4 sm:px-6 lg:px-8 bg-cream">
    <div class="max-w-7xl mx-auto">
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div class="max-w-xl">
          <p class="editorial-eyebrow text-terracotta-deep mb-3">
            Simulasi Investasi · Transparan
          </p>
          <h2 class="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-normal tracking-tight leading-[1.06] text-espresso">
            Susun paket sesuai tahap tumbuh bisnismu.
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-espresso/75 leading-relaxed">
          Pilih layanan satuan atau centang keempatnya sekaligus untuk menikmati <strong>Paket Kombo Branding Rp499.000</strong>.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Elegant Card List with Custom Checkboxes (7 cols) -->
        <div v-reveal="80" class="lg:col-span-7 flex flex-col gap-3.5">
          <label
            v-for="item in items"
            :key="item.id"
            :for="`calc-${item.id}`"
            class="rounded-[24px] p-5 sm:p-6 border flex items-start sm:items-center justify-between gap-4 cursor-pointer transition-all duration-500 ease-editorial select-none"
            :class="
              selectedIds.includes(item.id)
                ? 'bg-sand/75 border-terracotta/45 shadow-editorial -translate-y-0.5'
                : 'bg-cream border-espresso/10 shadow-editorial-sm hover:bg-sand/35 hover:-translate-y-0.5'
            "
          >
            <div class="flex items-start gap-4">
              <input
                :id="`calc-${item.id}`"
                v-model="selectedIds"
                :value="item.id"
                type="checkbox"
                class="sr-only peer"
              />
              <!-- Custom Rounded Checkbox -->
              <span
                class="mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ease-editorial peer-focus-visible:ring-2 peer-focus-visible:ring-terracotta peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-cream"
                :class="
                  selectedIds.includes(item.id)
                    ? 'bg-terracotta-deep border-terracotta-deep text-cream scale-105'
                    : 'bg-cream border-espresso/25 text-transparent'
                "
                aria-hidden="true"
              >
                <svg viewBox="0 0 16 16" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.5 8.5l3 3 6-6.5" />
                </svg>
              </span>

              <div>
                <div class="font-display text-lg sm:text-xl font-medium text-espresso leading-snug">
                  {{ item.name }}
                </div>
                <div class="text-xs sm:text-sm text-espresso/65 mt-1">
                  {{ item.detail }}
                </div>
              </div>
            </div>

            <span
              class="px-3.5 py-1.5 rounded-full border border-espresso/10 text-xs sm:text-sm font-medium shrink-0"
              :class="item.pillTint"
            >
              {{ formatRp(item.price) }}
            </span>
          </label>

          <!-- Quick Select All Bundle Action -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 px-1">
            <span class="text-xs sm:text-sm text-espresso/65">
              {{ selectedIds.length }} dari {{ items.length }} layanan dipilih
            </span>
            <button
              v-if="!isBundleActive"
              type="button"
              class="px-5 py-2.5 rounded-full bg-butter-soft hover:bg-butter text-espresso border border-espresso/10 text-xs sm:text-sm font-medium transition-all duration-300 ease-editorial hover:-translate-y-0.5"
              @click="selectAllBundle"
            >
              + Pilih Semua &amp; Aktifkan Paket Rp499.000
            </button>
          </div>
        </div>

        <!-- Right: Editorial Summary Card with Count Tween & Soft Ribbon (5 cols) -->
        <div
          v-reveal="160"
          class="lg:col-span-5 rounded-[28px] bg-sand border border-espresso/10 shadow-editorial-lg p-7 sm:p-9 relative overflow-hidden"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-espresso/10">
            <span class="editorial-eyebrow text-espresso/65">
              Ringkasan Estimasi
            </span>

            <!-- Soft Animated "Hemat 30%" Ribbon Pill -->
            <span
              v-if="isBundleActive"
              :key="ribbonKey"
              class="animate-ribbon inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-butter text-espresso border border-espresso/10 text-xs font-semibold shadow-editorial-sm"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-terracotta-deep" aria-hidden="true"></span>
              <span>Hemat 30%</span>
            </span>
          </div>

          <div class="py-6 space-y-3 min-h-[136px]">
            <div v-if="selectedIds.length === 0" class="text-sm text-espresso/60 py-6 text-center">
              Pilih minimal satu layanan di sebelah kiri untuk melihat simulasi investasi.
            </div>
            <div
              v-for="it in items.filter((x) => selectedIds.includes(x.id))"
              :key="it.id"
              class="flex items-center justify-between gap-3 text-sm text-espresso/85"
            >
              <span>{{ it.name }}</span>
              <span class="font-medium text-espresso shrink-0">{{ formatRp(it.price) }}</span>
            </div>
          </div>

          <!-- Total Display with Eased Tween & Bundle Strikethrough -->
          <div class="pt-6 border-t border-espresso/10">
            <div class="flex items-baseline justify-between gap-2 mb-1">
              <span class="editorial-eyebrow text-espresso/65">Total Investasi</span>
              <span
                v-if="isBundleActive"
                class="text-base font-medium text-terracotta-deep line-through decoration-terracotta-deep/80"
              >
                Rp715.000
              </span>
            </div>

            <div
              class="font-display text-4xl sm:text-5xl font-medium tracking-tight text-espresso my-2"
              aria-live="polite"
            >
              {{ formatRp(displayedTotal) }}
            </div>

            <p v-if="isBundleActive" class="text-xs sm:text-sm font-medium text-sage-deep mb-6">
              ✓ Paket Kombo Branding UMKM aktif — hemat Rp216.000 dari harga satuan.
            </p>
            <p v-else class="text-xs sm:text-sm text-espresso/65 mb-6">
              Sudah termasuk 3x revisi terarah &amp; serah terima file master siap cetak.
            </p>

            <a
              :href="waCalcUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full pill-btn-primary px-6 py-4 text-sm sm:text-base text-center"
            >
              <span>{{ isBundleActive ? 'Klaim Paket Kombo Rp499.000' : 'Kirim Estimasi ke WhatsApp' }}</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
