<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const sectionRef = ref<HTMLElement | null>(null)
const scrollerRef = ref<HTMLElement | null>(null)
const progress = ref(0.12)
const activeStep = ref(0)

const steps = [
  {
    num: '01',
    day: 'HARI KE-1',
    title: 'Diskusi & Brief Santai',
    color: 'bg-yellow',
    desc: 'Ceritakan produk, target pembeli, dan referensi warna lewat WhatsApp. Belum punya gambaran? Kami bantu arahkan gratis.'
  },
  {
    num: '02',
    day: 'HARI KE-1 – 2',
    title: 'Eksplorasi Konsep Lab',
    color: 'bg-cyan',
    desc: 'Tim Arc Lab merancang opsi konsep visual beserta mockup terapan agar kamu langsung kebayang wujud jadinya.'
  },
  {
    num: '03',
    day: 'HARI KE-2 – 3',
    title: 'Revisi & Presisi Ukuran',
    color: 'bg-coral text-paper',
    desc: 'Sempurnakan detail tipografi, komposisi warna, hingga ukuran pisau cetak (dieline) sampai benar-benar sreg.'
  },
  {
    num: '04',
    day: 'HARI KE-3 – 4',
    title: 'Serah Terima File Master',
    color: 'bg-indigo text-paper',
    desc: 'Terima paket file lengkap (AI, EPS, PDF CMYK siap cetak, SVG, dan PNG transparan) via Google Drive siap pakai.'
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
    class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper-dark/55"
  >
    <div class="max-w-7xl mx-auto">
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span class="brutal-tag bg-cyan text-ink mb-3">PROSES KERJA // LAB 04</span>
          <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Beres dalam 2–4 Hari Kerja
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-ink/80">
          Alur kerja ringkas 100% online. Geser kartu ke samping di ponsel atau gulir halaman untuk memantau progres tahapan.
        </p>
      </div>

      <!-- Progress Rail with Following Arc-Dot Marker -->
      <div v-reveal="60" class="mb-8 px-2">
        <div class="relative h-4 bg-paper border-2 border-ink shadow-brutal-sm">
          <div
            class="h-full bg-indigo transition-[width] duration-150 ease-out"
            :style="{ width: `${clampedPercent}%` }"
          ></div>

          <!-- Following Open Arc + Center Dot Marker -->
          <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-yellow border-2 border-ink shadow-brutal-sm flex items-center justify-center transition-[left] duration-150 ease-out"
            :style="{ left: `${clampedPercent}%` }"
            aria-hidden="true"
          >
            <svg viewBox="0 0 36 36" class="w-7 h-7">
              <path
                d="M9 25 A11 11 0 1 1 27 25"
                fill="none"
                stroke="#0B0B0F"
                stroke-width="3.5"
                stroke-linecap="round"
              />
              <circle cx="18" cy="18" r="4" fill="#FF6B4A" stroke="#0B0B0F" stroke-width="1.5" />
            </svg>
          </div>
        </div>

        <div class="flex justify-between mt-3 font-mono text-[11px] font-bold uppercase text-ink/75">
          <span>Tahap {{ steps[activeStep]?.num }} Aktif</span>
          <span class="lg:hidden">Geser ke samping →</span>
          <span class="hidden lg:inline">100% Transparan &amp; Tepat Waktu</span>
        </div>
      </div>

      <!-- Horizontal Scroll-Snap on Mobile, 4-Column Grid on Desktop -->
      <div
        ref="scrollerRef"
        class="flex lg:grid lg:grid-cols-4 gap-5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory no-scrollbar pb-4"
        @scroll.passive="onHorizontalScroll"
      >
        <article
          v-for="(step, idx) in steps"
          :key="step.num"
          class="snap-center shrink-0 w-[84vw] max-w-[330px] lg:w-auto lg:max-w-none brutal-card p-6 flex flex-col justify-between gap-5 cursor-pointer transition-transform duration-200"
          :class="activeStep === idx ? '-translate-y-1 ring-2 ring-indigo' : 'hover:-translate-y-0.5'"
          @click="selectStep(idx)"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <span
                class="inline-flex items-center justify-center px-3 py-1 border-2 border-ink font-mono text-sm font-bold"
                :class="step.color"
              >
                {{ step.num }}
              </span>
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-ink/70">
                {{ step.day }}
              </span>
            </div>

            <h3 class="font-display text-xl font-bold mb-2.5">
              {{ step.title }}
            </h3>
            <p class="text-sm text-ink/85 leading-relaxed">
              {{ step.desc }}
            </p>
          </div>

          <div class="pt-3 border-t-2 border-ink/15 flex items-center justify-between font-mono text-xs font-semibold">
            <span>Langkah {{ idx + 1 }} dari 4</span>
            <span v-if="activeStep === idx" class="text-indigo font-bold">● Aktif</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
