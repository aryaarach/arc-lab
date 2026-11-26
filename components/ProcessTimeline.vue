<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const sectionRef = ref<HTMLElement | null>(null)
const scrollerRef = ref<HTMLElement | null>(null)
const progress = ref(0.1)
const activeStep = ref(0)

const steps = [
  {
    num: '01',
    day: 'HARI KE-1',
    title: 'Diskusi & Brief',
    desc: 'Ceritakan produk, target pembeli, dan referensi lewat WhatsApp. Belum punya konsep? Kami petakan arah visualnya secara gratis.'
  },
  {
    num: '02',
    day: 'HARI KE-1 – 2',
    title: 'Eksplorasi Visual',
    desc: 'Tim Arc Lab menyusun alternatif desain beserta pratinjau mockup 3D agar proporsi di kemasan langsung terlihat nyata.'
  },
  {
    num: '03',
    day: 'HARI KE-2 – 3',
    title: 'Revisi & Presisi Cetak',
    desc: 'Penajaman tipografi, komposisi warna, hingga garis potong pisau cetak (dieline) sampai seluruh detail disetujui.'
  },
  {
    num: '04',
    day: 'HARI KE-3 – 4',
    title: 'Serah Terima Master',
    desc: 'Seluruh file master siap cetak (AI, EPS, PDF CMYK, SVG, dan PNG transparan) dikirim rapi melalui tautan Google Drive.'
  }
]

const clampedPercent = computed(() => Math.min(99, Math.max(1, progress.value * 100)))

function selectStep(index: number) {
  activeStep.value = index
  progress.value = index / (steps.length - 1)
  const scroller = scrollerRef.value
  if (scroller && scroller.scrollWidth > scroller.clientWidth + 12) {
    const maxScroll = scroller.scrollWidth - scroller.clientWidth
    scroller.scrollTo({
      left: (index / (steps.length - 1)) * maxScroll,
      behavior: 'smooth'
    })
  }
}

function onHorizontalScroll() {
  const scroller = scrollerRef.value
  if (!scroller) return
  const maxScroll = scroller.scrollWidth - scroller.clientWidth
  if (maxScroll <= 8) return
  const ratio = Math.min(1, Math.max(0, scroller.scrollLeft / maxScroll))
  progress.value = ratio
  activeStep.value = Math.min(steps.length - 1, Math.round(ratio * (steps.length - 1)))
}

function onWindowScroll() {
  const scroller = scrollerRef.value
  if (scroller && scroller.scrollWidth > scroller.clientWidth + 12) return
  const sec = sectionRef.value
  if (!sec) return
  const rect = sec.getBoundingClientRect()
  const vh = window.innerHeight || 800
  const start = vh * 0.78
  const end = vh * 0.22
  const raw = (start - rect.top) / (start - end + rect.height * 0.35)
  const ratio = Math.min(1, Math.max(0, raw))
  progress.value = ratio
  activeStep.value = Math.min(steps.length - 1, Math.round(ratio * (steps.length - 1)))
}

onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  window.addEventListener('resize', onWindowScroll, { passive: true })
  onWindowScroll()
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', onWindowScroll)
  window.removeEventListener('resize', onWindowScroll)
})
</script>

<template>
  <section
    id="alur"
    ref="sectionRef"
    class="py-20 sm:py-28 lg:py-32 bg-off-white border-y border-line"
  >
    <div class="swiss-container">
      <!-- Numbered Swiss Section Header -->
      <div v-reveal class="mb-14 sm:mb-16">
        <div class="swiss-section-rule mb-5"></div>
        <div class="swiss-grid gap-y-6 items-end">
          <div class="col-span-4 lg:col-span-2">
            <span class="swiss-mono text-signal">04 / PROSES</span>
          </div>
          <div class="col-span-4 lg:col-span-6">
            <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[0.98] text-black text-left">
              Selesai dalam 2–4 hari kerja.
            </h2>
          </div>
          <div class="col-span-4 lg:col-span-4">
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed text-left">
              Alur pengerjaan ringkas 100% daring. Gulir halaman atau geser tahapan di ponsel untuk memantau progres kerja.
            </p>
          </div>
        </div>
      </div>

      <!-- Continuous 1px Rule with Small Following Signal Red Dot Marker -->
      <div v-reveal="60" class="mb-8">
        <div class="flex items-center justify-between swiss-mono text-dark-gray mb-3">
          <span>TAHAP AKTIF: {{ steps[activeStep]?.num }} / 04</span>
          <span class="lg:hidden">GESER KE SAMPING →</span>
          <span class="hidden lg:inline">TEPAT WAKTU · TRANSPARAN</span>
        </div>

        <div class="relative h-px w-full bg-line">
          <div
            class="absolute inset-y-0 left-0 bg-black transition-[width] duration-300 ease-out"
            :style="{ width: `${clampedPercent}%` }"
          ></div>
          <span
            aria-hidden="true"
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-signal transition-[left] duration-300 ease-out"
            :style="{ left: `${clampedPercent}%` }"
          ></span>
        </div>
      </div>

      <!-- Horizontal 4-Column Grid with Big Numerals 01-04 & 1px Top Rules -->
      <div
        ref="scrollerRef"
        class="flex lg:grid lg:grid-cols-4 gap-6 overflow-x-auto lg:overflow-visible snap-x snap-mandatory no-scrollbar pb-2"
        @scroll.passive="onHorizontalScroll"
      >
        <article
          v-for="(step, idx) in steps"
          :key="step.num"
          class="snap-start shrink-0 w-[82vw] max-w-[320px] lg:w-auto lg:max-w-none pt-6 border-t flex flex-col justify-between gap-8 cursor-pointer text-left transition-colors duration-300 ease-out"
          :class="activeStep === idx ? 'border-black' : 'border-line hover:border-black'"
          @click="selectStep(idx)"
        >
          <div>
            <div class="flex items-baseline justify-between gap-4 mb-6">
              <span
                class="font-display text-6xl sm:text-7xl font-medium tracking-[-0.04em] leading-none transition-colors duration-300"
                :class="activeStep === idx ? 'text-signal' : 'text-black'"
              >
                {{ step.num }}
              </span>
              <span class="swiss-mono text-dark-gray">
                {{ step.day }}
              </span>
            </div>

            <h3 class="font-display text-xl sm:text-2xl font-medium tracking-[-0.025em] text-black mb-2.5">
              {{ step.title }}
            </h3>
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed">
              {{ step.desc }}
            </p>
          </div>

          <div class="swiss-mono flex items-center justify-between pt-4 border-t border-line">
            <span class="text-dark-gray">{{ step.num }} / 04</span>
            <span v-if="activeStep === idx" class="text-signal font-semibold">AKTIF</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
