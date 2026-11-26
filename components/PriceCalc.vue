<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

interface CalcItem {
  idx: string
  id: string
  name: string
  detail: string
  price: number
}

const config = useAppConfig()

// Individual sum = 150.000 + 115.000 + 200.000 + 250.000 = Rp715.000
const items: CalcItem[] = [
  {
    idx: '01',
    id: 'logo',
    name: 'Desain Logo & Palet Brand',
    detail: '3 konsep awal · 3x revisi · Master AI, EPS, SVG & PNG',
    price: 150000
  },
  {
    idx: '02',
    id: 'banner',
    name: 'Banner Cetak & Header Toko',
    detail: 'Spanduk booth CMYK tajam + header marketplace',
    price: 115000
  },
  {
    idx: '03',
    id: 'kemasan',
    name: 'Desain Kemasan + Mockup 3D',
    detail: 'Standing pouch, dus, atau label siap kirim percetakan',
    price: 200000
  },
  {
    idx: '04',
    id: 'feed',
    name: 'Paket 9 Konten Feed Instagram',
    detail: 'Grid seragam + template mudah diedit ulang',
    price: 250000
  }
]

const BUNDLE_PRICE = 499000
const FULL_SUM_PRICE = 715000

const selectedIds = ref<string[]>(['logo', 'kemasan'])
const displayedTotal = ref(350000)

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

  const duration = 380
  const startTime = performance.now()

  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / duration)
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
  <section id="harga" class="py-20 sm:py-28 lg:py-32 bg-white">
    <div class="swiss-container">
      <!-- Numbered Swiss Section Header -->
      <div v-reveal class="mb-14 sm:mb-16">
        <div class="swiss-section-rule mb-5"></div>
        <div class="swiss-grid gap-y-6 items-end">
          <div class="col-span-4 lg:col-span-2">
            <span class="swiss-mono text-signal">05 / HARGA</span>
          </div>
          <div class="col-span-4 lg:col-span-6">
            <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[0.98] text-black text-left">
              Kalkulator paket desain UMKM.
            </h2>
          </div>
          <div class="col-span-4 lg:col-span-4">
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed text-left">
              Centang kebutuhan bisnismu secara mandiri. Pilih keempat layanan sekaligus untuk mengaktifkan Paket Kombo Rp499.000.
            </p>
          </div>
        </div>
      </div>

      <!-- 12-Col Layout: 7-Col Tabular List + 5-Col Summary -->
      <div class="swiss-grid gap-y-12 items-start">
        <!-- Left 7 Cols: Table-Like List with 1px Row Rules & Square Custom Checkboxes -->
        <div v-reveal="60" class="col-span-4 lg:col-span-7">
          <div class="border-t border-black">
            <label
              v-for="item in items"
              :key="item.id"
              :for="`calc-${item.id}`"
              class="group py-5 sm:py-6 border-b border-line flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors duration-300 ease-out hover:bg-off-white/60 px-1"
            >
              <div class="flex items-start gap-4">
                <span class="relative mt-1 flex items-center justify-center shrink-0">
                  <input
                    :id="`calc-${item.id}`"
                    v-model="selectedIds"
                    :value="item.id"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <span
                    class="w-5 h-5 rounded-none border border-black bg-white flex items-center justify-center transition-colors duration-300 ease-out peer-checked:bg-black peer-checked:border-black peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal"
                    aria-hidden="true"
                  >
                    <svg
                      v-if="selectedIds.includes(item.id)"
                      viewBox="0 0 14 14"
                      class="w-3.5 h-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="square"
                    >
                      <path d="M2.5 7.2L5.6 10.3L11.5 3.8" />
                    </svg>
                  </span>
                </span>

                <div class="text-left">
                  <div class="flex items-baseline gap-2.5">
                    <span
                      class="swiss-mono"
                      :class="selectedIds.includes(item.id) ? 'text-signal' : 'text-mid-gray'"
                    >
                      {{ item.idx }}
                    </span>
                    <span class="font-display text-lg sm:text-xl font-medium tracking-[-0.02em] text-black">
                      {{ item.name }}
                    </span>
                  </div>
                  <p class="text-xs sm:text-sm text-dark-gray mt-1 leading-relaxed">
                    {{ item.detail }}
                  </p>
                </div>
              </div>

              <span class="font-mono text-xs sm:text-sm uppercase tabular-nums text-right text-black shrink-0 pt-1 sm:pt-0">
                {{ formatRp(item.price) }}
              </span>
            </label>
          </div>

          <!-- Quick Select All Row -->
          <div class="pt-5 flex flex-wrap items-center justify-between gap-4">
            <span class="swiss-mono text-dark-gray">
              {{ selectedIds.length }} / 4 LAYANAN DIPILIH
            </span>
            <button
              v-if="!isBundleActive"
              type="button"
              class="swiss-btn-secondary px-4 py-2 text-xs swiss-mono"
              @click="selectAllBundle"
            >
              + Pilih Semua &amp; Aktifkan Paket Rp499.000
            </button>
          </div>
        </div>

        <!-- Right 5 Cols: Huge Grotesk Total with Count Tween & Bundle State -->
        <div
          v-reveal="120"
          class="col-span-4 lg:col-span-5 lg:pl-8 lg:border-l border-line border-t lg:border-t-0 pt-8 lg:pt-0"
        >
          <div class="border-t border-black pt-5">
            <div class="flex items-center justify-between gap-3 pb-4 border-b border-line">
              <span class="swiss-mono text-black">RINGKASAN INVESTASI</span>
              <span
                v-if="isBundleActive"
                class="swiss-mono text-signal font-semibold animate-fade-in"
              >
                HEMAT 30%
              </span>
            </div>

            <!-- Selected Breakdown -->
            <div class="py-5 space-y-3 min-h-[124px]">
              <p v-if="selectedIds.length === 0" class="text-sm text-dark-gray py-4 text-left">
                Pilih minimal satu layanan di sebelah kiri untuk menampilkan simulasi biaya.
              </p>
              <div
                v-for="it in items.filter((x) => selectedIds.includes(x.id))"
                :key="it.id"
                class="flex items-baseline justify-between gap-4 text-sm"
              >
                <span class="text-black text-left">{{ it.name }}</span>
                <span class="font-mono text-xs uppercase tabular-nums text-dark-gray text-right shrink-0">
                  {{ formatRp(it.price) }}
                </span>
              </div>
            </div>

            <!-- Huge Grotesk Numeral Total -->
            <div class="pt-6 border-t border-black text-left">
              <div class="flex items-baseline justify-between gap-3 mb-2">
                <span class="swiss-mono text-dark-gray">ESTIMASI TOTAL</span>
                <span
                  v-if="isBundleActive"
                  class="font-mono text-sm sm:text-base text-mid-gray line-through tabular-nums animate-fade-in"
                >
                  Rp715.000
                </span>
              </div>

              <div
                class="font-display text-5xl sm:text-6xl xl:text-7xl font-medium tracking-[-0.04em] leading-none tabular-nums my-3 transition-colors duration-300 ease-out"
                :class="isBundleActive ? 'text-signal' : 'text-black'"
                aria-live="polite"
              >
                {{ formatRp(displayedTotal) }}
              </div>

              <p class="text-xs sm:text-sm text-dark-gray leading-relaxed mb-6 text-left">
                <template v-if="isBundleActive">
                  Paket Kombo Branding UMKM diterapkan otomatis — hemat Rp216.000 lengkap dengan file master cetak.
                </template>
                <template v-else>
                  Sudah termasuk 3x sesi revisi terarah dan penyerahan file master siap cetak.
                </template>
              </p>

              <a
                :href="waCalcUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="group w-full swiss-btn-primary px-6 py-4 text-sm sm:text-base"
              >
                <span>{{ isBundleActive ? 'Klaim Paket Rp499.000' : 'Kirim Estimasi ke WhatsApp' }}</span>
                <span class="swiss-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
