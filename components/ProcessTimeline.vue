<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const sectionRef = ref<HTMLElement | null>(null)
const desktopListRef = ref<HTMLElement | null>(null)
const scrollerRef = ref<HTMLElement | null>(null)
const progress = ref(0.08)
const activeStep = ref(0)

const steps = [
  {
    num: '01',
    day: 'Hari Ke-1',
    title: 'Diskusi & Pemetaan Konsep',
    tint: 'bg-cream',
    desc: 'Ceritakan produk, target pembeli, dan suasana warna yang kamu sukai lewat WhatsApp. Belum punya gambaran? Kami bantu petakan arah visualnya secara gratis.'
  },
  {
    num: '02',
    day: 'Hari Ke-1 – 2',
    title: 'Eksplorasi Visual & Mockup',
    tint: 'bg-cream',
    desc: 'Tim Arc Lab merancang opsi konsep desain lengkap dengan pratinjau terapan 3D agar kamu langsung melihat karakter produknya secara nyata.'
  },
  {
    num: '03',
    day: 'Hari Ke-2 – 3',
    title: 'Penyempurnaan & Presisi Cetak',
    tint: 'bg-cream',
    desc: 'Haluskan detail tipografi, proporsi warna, komposisi informasi PIRT/Halal, hingga ukuran garis potong (dieline) sampai benar-benar pas.'
  },
  {
    num: '04',
    day: 'Hari Ke-3 – 4',
    title: 'Serah Terima File Master',
    tint: 'bg-cream',
    desc: 'Terima paket file lengkap (AI, EPS, PDF CMYK siap cetak, SVG, dan PNG transparan) melalui Google Drive dengan hak milik penuh.'
  }
]

const clampedPercent = computed(() => Math.min(96, Math.max(4, progress.value * 100)))

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
  // Only drive from vertical page scroll on desktop where horizontal overflow is inactive
  if (scroller && scroller.scrollWidth > scroller.clientWidth + 12) return
  const targetEl = desktopListRef.value || sectionRef.value
  if (!targetEl) return
  const rect = targetEl.getBoundingClientRect()
  const vh = window.innerHeight || 800
  const start = vh * 0.74
  const end = vh * 0.24
  const span = Math.max(160, rect.height - (start - end) * 0.45)
  const raw = (start - rect.top) / span
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
    class="py-24 sm:py-28 px-4 sm:px-6 lg:px-8 bg-sand/55 border-y border-espresso/10"
  >
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <!-- Left Sticky Editorial Header + Sticky Vertical Progress Indicator (Desktop) -->
        <div v-reveal class="lg:col-span-5 lg:sticky lg:top-28">
          <p class="editorial-eyebrow text-terracotta-deep mb-3">
            Alur Pengerjaan · 100% Online
          </p>
          <h2 class="font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-normal tracking-tight leading-[1.06] text-espresso">
            Rapi dan terukur dalam 2–4 hari kerja.
          </h2>
          <p class="mt-4 text-sm sm:text-base text-espresso/75 leading-relaxed max-w-md">
            Tanpa birokrasi berbelit. Gulir halaman di desktop atau geser kartu ke samping pada ponsel untuk menelusuri tiap tahap pengerjaan.
          </p>

          <!-- Desktop Sticky Step Counter Pill -->
          <div class="hidden lg:inline-flex items-center gap-3 mt-8 px-5 py-3 rounded-full bg-cream border border-espresso/10 shadow-editorial-sm">
            <span class="w-2.5 h-2.5 rounded-full bg-terracotta" aria-hidden="true"></span>
            <span class="text-sm font-medium text-espresso">
              Tahap {{ steps[activeStep]?.num }} · {{ steps[activeStep]?.title }}
            </span>
          </div>
        </div>

        <!-- Right Column: Mobile Horizontal Progress + Scroll-Snap / Desktop Vertical Editorial List with Progress Line -->
        <div class="lg:col-span-7">
          <!-- Mobile Horizontal Progress Rail with Following Arc-Dot Marker -->
          <div v-reveal="60" class="lg:hidden mb-8 px-2">
            <div class="relative h-[2px] rounded-full bg-espresso/15">
              <div
                class="h-full rounded-full bg-terracotta transition-[width] duration-200 ease-out"
                :style="{ width: `${clampedPercent}%` }"
              ></div>

              <!-- Mobile Following Arc-Dot Marker -->
              <div
                class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-cream border border-espresso/15 shadow-editorial-sm flex items-center justify-center transition-[left] duration-200 ease-out"
                :style="{ left: `${clampedPercent}%` }"
                aria-hidden="true"
              >
                <svg viewBox="0 0 28 28" class="w-5 h-5 text-terracotta" fill="none">
                  <path
                    d="M7.5 19.5 A8.5 8.5 0 1 1 20.5 19.5"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                  />
                  <circle cx="14" cy="14.5" r="2.6" fill="currentColor" />
                </svg>
              </div>
            </div>

            <div class="flex justify-between mt-4 editorial-eyebrow text-espresso/60">
              <span>Tahap {{ steps[activeStep]?.num }} Aktif</span>
              <span>Geser ke samping →</span>
            </div>
          </div>

          <!-- Timeline Track Container -->
          <div ref="desktopListRef" class="relative lg:pl-14">
            <!-- Desktop Vertical Progress Line + Following Arc-Dot Marker -->
            <div
              class="hidden lg:block absolute left-4 top-6 bottom-6 w-[1.5px] bg-espresso/15 rounded-full"
              aria-hidden="true"
            >
              <div
                class="w-full bg-terracotta rounded-full transition-[height] duration-200 ease-out"
                :style="{ height: `${clampedPercent}%` }"
              ></div>

              <!-- Desktop Following Arc-Dot Marker -->
              <div
                class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cream border border-espresso/15 shadow-editorial-sm flex items-center justify-center transition-[top] duration-200 ease-out"
                :style="{ top: `${clampedPercent}%` }"
              >
                <svg viewBox="0 0 28 28" class="w-5 h-5 text-terracotta" fill="none">
                  <path
                    d="M7.5 19.5 A8.5 8.5 0 1 1 20.5 19.5"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                  />
                  <circle cx="14" cy="14.5" r="2.6" fill="currentColor" />
                </svg>
              </div>
            </div>

            <!-- Horizontal Scroll-Snap on Mobile, Vertical Editorial Stack on Desktop -->
            <div
              ref="scrollerRef"
              class="flex lg:flex-col gap-5 lg:gap-6 overflow-x-auto lg:overflow-visible snap-x snap-mandatory no-scrollbar pb-4 lg:pb-0"
              @scroll.passive="onHorizontalScroll"
            >
              <article
                v-for="(step, idx) in steps"
                :key="step.num"
                class="snap-center shrink-0 w-[84vw] max-w-[340px] lg:w-full lg:max-w-none rounded-[24px] bg-cream border p-6 sm:p-8 flex flex-col justify-between gap-5 cursor-pointer transition-all duration-500 ease-editorial"
                :class="
                  activeStep === idx
                    ? 'border-terracotta/55 shadow-editorial -translate-y-1'
                    : 'border-espresso/10 shadow-editorial-sm hover:-translate-y-0.5 hover:border-espresso/20'
                "
                @click="selectStep(idx)"
              >
                <div>
                  <div class="flex items-center justify-between gap-3 mb-4">
                    <span class="font-display italic font-light text-4xl text-terracotta-deep leading-none">
                      {{ step.num }}
                    </span>
                    <span class="px-3.5 py-1 rounded-full bg-sand text-xs font-medium text-espresso/75">
                      {{ step.day }}
                    </span>
                  </div>

                  <h3 class="font-display text-xl sm:text-2xl font-medium text-espresso mb-2.5">
                    {{ step.title }}
                  </h3>
                  <p class="text-sm sm:text-base text-espresso/75 leading-relaxed">
                    {{ step.desc }}
                  </p>
                </div>

                <div class="pt-4 border-t border-espresso/10 flex items-center justify-between text-xs text-espresso/60">
                  <span>Langkah {{ idx + 1 }} dari {{ steps.length }}</span>
                  <span v-if="activeStep === idx" class="font-medium text-terracotta-deep">
                    ● Tahap Aktif
                  </span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
