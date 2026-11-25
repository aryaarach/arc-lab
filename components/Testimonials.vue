<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const reviews = [
  {
    name: 'Teh Rini Suryani',
    business: 'Kriuk Singkong Rempah · Bandung',
    badge: 'Omzet Naik 2x',
    avatarTint: 'bg-butter-soft text-espresso',
    initials: 'RS',
    quote:
      'Dulu keripik saya hanya memakai plastik bening dan stiker hitam putih, sering ditolak toko oleh-oleh. Setelah digarap ulang kemasan dan logonya oleh Arc Lab, langsung diterima di sembilan toko besar.'
  },
  {
    name: 'Dimas Prakoso',
    business: 'Kopi Titik Kumpul · Yogyakarta',
    badge: 'Selesai 3 Hari',
    avatarTint: 'bg-sage-soft text-sage-deep',
    initials: 'DP',
    quote:
      'Paling senang dengan ketenangan komunikasinya. Belum punya bayangan konsep pun tetap dibantu merangkai arah warna sampai pas. File kaleng dan cup langsung siap naik cetak tanpa revisi ukuran.'
  },
  {
    name: 'Nadia Maharani',
    business: 'Lumea Sabun Alami · Surabaya',
    badge: 'Paket Kombo Rp499rb',
    avatarTint: 'bg-terracotta-soft text-terracotta-deep',
    initials: 'NM',
    quote:
      'Mengambil Paket Kombo Rp499.000 benar-benar terasa sepadan. Dapat logo, dus kemasan, banner bazar, sampai template feed Instagram yang membuat bisnis baru saya tampil matang sejak hari pertama.'
  }
]

const activeIndex = ref(0)
const isPaused = ref(false)
const currentReview = computed(() => reviews[activeIndex.value] || reviews[0])

let autoTimer: ReturnType<typeof setInterval> | null = null

function prevSlide() {
  activeIndex.value = (activeIndex.value - 1 + reviews.length) % reviews.length
}

function nextSlide() {
  activeIndex.value = (activeIndex.value + 1) % reviews.length
}

function goToSlide(idx: number) {
  activeIndex.value = idx
}

function onCarouselKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prevSlide()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    nextSlide()
  }
}

onMounted(() => {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  autoTimer = setInterval(() => {
    if (!isPaused.value) {
      nextSlide()
    }
  }, 6800)
})

onBeforeUnmount(() => {
  if (autoTimer) clearInterval(autoTimer)
})
</script>

<template>
  <section
    id="testimoni"
    class="py-24 sm:py-28 px-4 sm:px-6 lg:px-8 bg-sand/55 border-y border-espresso/10"
  >
    <div class="max-w-5xl mx-auto">
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <p class="editorial-eyebrow text-terracotta-deep mb-3">
            Cerita Pelaku Usaha · Testimoni
          </p>
          <h2 class="font-display text-4xl sm:text-5xl font-normal tracking-tight leading-[1.06] text-espresso">
            Tumbuh bersama 150+ UMKM lokal.
          </h2>
        </div>

        <!-- Prev / Next Carousel Controls -->
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="w-11 h-11 rounded-full bg-cream hover:bg-espresso text-espresso hover:text-cream border border-espresso/15 flex items-center justify-center transition-colors duration-300 ease-editorial shadow-editorial-sm"
            aria-label="Testimoni sebelumnya"
            @click="prevSlide"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            class="w-11 h-11 rounded-full bg-cream hover:bg-espresso text-espresso hover:text-cream border border-espresso/15 flex items-center justify-center transition-colors duration-300 ease-editorial shadow-editorial-sm"
            aria-label="Testimoni berikutnya"
            @click="nextSlide"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <!-- Featured Single Serif Quote Card with Fade Carousel -->
      <div
        v-reveal="100"
        tabindex="0"
        role="region"
        aria-roledescription="carousel"
        aria-label="Kutipan testimoni klien UMKM"
        class="rounded-[28px] bg-cream border border-espresso/10 shadow-editorial p-8 sm:p-12 lg:p-14 outline-none"
        @mouseenter="isPaused = true"
        @mouseleave="isPaused = false"
        @focusin="isPaused = true"
        @focusout="isPaused = false"
        @keydown="onCarouselKeydown"
      >
        <Transition name="quote-fade" mode="out-in">
          <article :key="currentReview.name" class="flex flex-col justify-between gap-10">
            <div>
              <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
                <span
                  class="font-display italic text-5xl leading-none text-terracotta select-none"
                  aria-hidden="true"
                >
                  “
                </span>
                <span class="px-4 py-1.5 rounded-full bg-sand border border-espresso/10 text-xs font-medium text-espresso">
                  {{ currentReview.badge }}
                </span>
              </div>

              <blockquote class="font-display text-2xl sm:text-3xl lg:text-[2.2rem] font-normal italic leading-[1.38] tracking-[-0.01em] text-espresso">
                {{ currentReview.quote }}
              </blockquote>
            </div>

            <div class="pt-6 border-t border-espresso/10 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-full border border-espresso/10 font-display font-semibold text-base flex items-center justify-center shrink-0"
                  :class="currentReview.avatarTint"
                  aria-hidden="true"
                >
                  {{ currentReview.initials }}
                </div>
                <div>
                  <div class="font-display font-medium text-lg text-espresso leading-tight">
                    {{ currentReview.name }}
                  </div>
                  <div class="text-xs sm:text-sm text-espresso/65 mt-0.5">
                    {{ currentReview.business }}
                  </div>
                </div>
              </div>

              <div class="text-xs text-terracotta-deep tracking-widest" aria-label="Rating 5 dari 5 bintang">
                ★★★★★
              </div>
            </div>
          </article>
        </Transition>

        <!-- Avatar Selector Dots / Pills -->
        <div class="mt-8 pt-6 border-t border-espresso/10 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2.5" role="tablist" aria-label="Pilih cerita klien">
            <button
              v-for="(rev, idx) in reviews"
              :key="rev.name"
              type="button"
              role="tab"
              :aria-selected="activeIndex === idx ? 'true' : 'false'"
              :aria-label="`Tampilkan testimoni ${rev.name}`"
              class="inline-flex items-center gap-2 pr-3.5 pl-1.5 py-1 rounded-full border text-xs font-medium transition-all duration-300 ease-editorial"
              :class="
                activeIndex === idx
                  ? 'bg-sand border-terracotta/55 text-espresso shadow-sm'
                  : 'bg-cream border-espresso/10 text-espresso/65 hover:bg-sand/50'
              "
              @click="goToSlide(idx)"
            >
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center font-display text-[11px] font-semibold"
                :class="rev.avatarTint"
                aria-hidden="true"
              >
                {{ rev.initials }}
              </span>
              <span class="hidden sm:inline">{{ rev.name.split(' ')[0] }} {{ rev.name.split(' ')[1] }}</span>
            </button>
          </div>

          <span class="text-xs text-espresso/55">
            {{ activeIndex + 1 }} / {{ reviews.length }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
