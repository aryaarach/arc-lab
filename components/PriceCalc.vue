<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

interface CalcItem {
  id: string
  name: string
  detail: string
  price: number
  tagColor: string
}

const config = useAppConfig()

// Individual sum = 150.000 + 115.000 + 200.000 + 250.000 = Rp715.000
const items: CalcItem[] = [
  {
    id: 'logo',
    name: 'Desain Logo & Palet Brand',
    detail: '3 konsep awal · 3x revisi · Master AI/EPS/SVG/PNG',
    price: 150000,
    tagColor: 'bg-yellow'
  },
  {
    id: 'banner',
    name: 'Banner Cetak & Header Toko',
    detail: 'Spanduk warung/booth CMYK + header marketplace',
    price: 115000,
    tagColor: 'bg-cyan'
  },
  {
    id: 'kemasan',
    name: 'Desain Kemasan + Mockup 3D',
    detail: 'Standing pouch / dus / label siap kirim percetakan',
    price: 200000,
    tagColor: 'bg-coral text-paper'
  },
  {
    id: 'feed',
    name: 'Paket 9 Konten Feed Instagram',
    detail: 'Grid rapi seragam + file template mudah diedit ulang',
    price: 250000,
    tagColor: 'bg-indigo text-paper'
  }
]

const BUNDLE_PRICE = 499000
const FULL_SUM_PRICE = 715000

const selectedIds = ref<string[]>(['logo', 'kemasan'])
const displayedTotal = ref(350000)
const stampKey = ref(0)

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

  const duration = 480
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
    stampKey.value++
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
  <section id="harga" class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper">
    <div class="max-w-7xl mx-auto">
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span class="brutal-tag bg-yellow text-ink mb-3">SIMULASI BIAYA // LAB 05</span>
          <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Kalkulator Paket Desain UMKM
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-ink/80">
          Centang kebutuhan bisnismu sendiri. Pilih keempat layanan sekaligus untuk mengaktifkan diskon <strong>Paket Kombo Branding Rp499.000</strong>!
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- 4 Checkboxes Column (7 cols) -->
        <div v-reveal="80" class="lg:col-span-7 flex flex-col gap-4">
          <label
            v-for="item in items"
            :key="item.id"
            :for="`calc-${item.id}`"
            class="brutal-card p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer transition-all select-none"
            :class="
              selectedIds.includes(item.id)
                ? 'bg-yellow/35 -translate-y-0.5 ring-2 ring-ink'
                : 'bg-paper hover:bg-paper-dark/60'
            "
          >
            <div class="flex items-start gap-4">
              <input
                :id="`calc-${item.id}`"
                v-model="selectedIds"
                :value="item.id"
                type="checkbox"
                class="mt-1 w-6 h-6 accent-[#5B5BFF] border-2 border-ink cursor-pointer shrink-0"
              />
              <div>
                <div class="font-display text-lg sm:text-xl font-bold leading-snug">
                  {{ item.name }}
                </div>
                <div class="text-xs sm:text-sm text-ink/75 mt-1">
                  {{ item.detail }}
                </div>
              </div>
            </div>

            <span
              class="px-3 py-1.5 border-2 border-ink font-mono text-xs sm:text-sm font-bold shrink-0 shadow-brutal-sm"
              :class="item.tagColor"
            >
              {{ formatRp(item.price) }}
            </span>
          </label>

          <!-- Quick Select All Button -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span class="font-mono text-xs text-ink/75">
              {{ selectedIds.length }} dari 4 layanan dipilih
            </span>
            <button
              v-if="!isBundleActive"
              type="button"
              class="px-4 py-2 bg-cyan border-2 border-ink font-mono text-xs font-bold uppercase shadow-brutal-sm hover:bg-yellow active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              @click="selectAllBundle"
            >
              + Centang Semua &amp; Klaim Harga Rp499.000
            </button>
          </div>
        </div>

        <!-- Live Animated Receipt Card (5 cols) -->
        <div v-reveal="160" class="lg:col-span-5 brutal-card bg-paper-dark p-6 sm:p-8 relative overflow-hidden">
          <!-- Animated Rubber Stamp when all 4 are checked -->
          <div
            v-if="isBundleActive"
            :key="stampKey"
            class="animate-stamp absolute top-5 right-4 z-10 px-3.5 py-1.5 bg-coral text-paper border-3 border-ink font-mono text-xs font-extrabold uppercase tracking-wider shadow-brutal-sm pointer-events-none"
          >
            ★ HEMAT RP216.000!
          </div>

          <div class="font-mono text-xs font-bold uppercase tracking-wider text-ink/70 pb-4 border-b-2 border-dashed border-ink">
            RINGKASAN ESTIMASI // ARC LAB
          </div>

          <div class="py-5 space-y-2.5 min-h-[128px]">
            <div v-if="selectedIds.length === 0" class="font-mono text-sm text-ink/60 py-6 text-center">
              Pilih minimal satu layanan di sebelah kiri untuk melihat simulasi biaya.
            </div>
            <div
              v-for="it in items.filter((x) => selectedIds.includes(x.id))"
              :key="it.id"
              class="flex items-center justify-between text-sm font-medium"
            >
              <span>{{ it.name }}</span>
              <span class="font-mono font-semibold">{{ formatRp(it.price) }}</span>
            </div>
          </div>

          <!-- Total Display with Eased Tween & Bundle Strikethrough -->
          <div class="pt-5 border-t-2 border-ink">
            <div class="flex items-baseline justify-between gap-2 mb-1">
              <span class="font-mono text-xs font-bold uppercase">Total Investasi</span>
              <span
                v-if="isBundleActive"
                class="font-mono text-base font-bold text-coral line-through decoration-2"
              >
                Rp715.000
              </span>
            </div>

            <div
              class="font-display text-4xl sm:text-5xl font-bold tracking-tight my-2"
              aria-live="polite"
            >
              {{ formatRp(displayedTotal) }}
            </div>

            <p v-if="isBundleActive" class="font-mono text-xs font-bold text-indigo mb-5">
              ✓ Paket Kombo Branding UMKM otomatis diterapkan (Hemat 30%)!
            </p>
            <p v-else class="font-mono text-xs text-ink/70 mb-5">
              Sudah termasuk revisi terarah &amp; file master siap cetak.
            </p>

            <a
              :href="waCalcUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full brutal-btn bg-indigo text-paper px-6 py-4 text-base text-center"
            >
              <span>{{ isBundleActive ? 'Klaim Paket Kombo Rp499rb' : 'Kirim Estimasi ke WhatsApp' }}</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
