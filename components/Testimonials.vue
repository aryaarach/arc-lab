<script setup lang="ts">
import { ref, computed } from 'vue'

const reviews = [
  {
    name: 'Teh Rini Suryani',
    business: 'Kriuk Singkong Rempah · Bandung',
    metric: 'DITERIMA DI 9 TOKO OLEH-OLEH',
    quote:
      'Dulu keripik saya hanya memakai plastik bening dan stiker hitam putih. Setelah kemasan dan logonya ditata ulang oleh Arc Lab, langsung diterima di sembilan toko besar.'
  },
  {
    name: 'Dimas Prakoso',
    business: 'Kopi Titik Kumpul · Yogyakarta',
    metric: 'SELESAI DALAM 3 HARI KERJA',
    quote:
      'Komunikasinya sangat terstruktur. Belum punya bayangan konsep pun tetap dibantu memetakan arah visual sampai pas, dan file kaleng langsung naik cetak tanpa revisi ukuran.'
  },
  {
    name: 'Nadia Maharani',
    business: 'Lumea Sabun Alami · Surabaya',
    metric: 'PAKET KOMBO RP499.000',
    quote:
      'Paket Kombo Rp499.000 benar-benar efisien. Dapat logo, dus kemasan, banner bazar, hingga sistem feed Instagram yang membuat brand baru kami tampil mapan.'
  },
  {
    name: 'Hendra Wijaya',
    business: 'Sambal Roa Manado Asli · Makassar',
    metric: 'PENJUALAN MARKETPLACE NAIK 3X',
    quote:
      'Label toples kaca dan foto mockup 3D dari Arc Lab langsung menaikkan rasio klik toko kami di marketplace tanpa perlu sewa studio foto mahal.'
  },
  {
    name: 'Sari Kusumawardani',
    business: 'Teh Seduh Botanika · Solo',
    metric: 'SIAP MASUK KAFE & RITEL MODERN',
    quote:
      'Tipografi kemasannya bersih dan sangat mudah dibaca pembeli. Semua informasi PIRT, komposisi, dan kode batang tertata presisi di atas standing pouch.'
  }
]

const currentIndex = ref(0)

const currentReview = computed(() => reviews[currentIndex.value] || reviews[0])

const formattedIndex = computed(
  () => `${String(currentIndex.value + 1).padStart(2, '0')} / ${String(reviews.length).padStart(2, '0')}`
)

function prevQuote() {
  currentIndex.value = (currentIndex.value - 1 + reviews.length) % reviews.length
}

function nextQuote() {
  currentIndex.value = (currentIndex.value + 1) % reviews.length
}
</script>

<template>
  <section id="testimoni" class="py-20 sm:py-28 lg:py-32 bg-off-white border-y border-line">
    <div class="swiss-container">
      <!-- Numbered Swiss Section Header -->
      <div v-reveal class="mb-14 sm:mb-16">
        <div class="swiss-section-rule mb-5"></div>
        <div class="swiss-grid gap-y-6 items-end">
          <div class="col-span-4 lg:col-span-2">
            <span class="swiss-mono text-signal">06 / TESTIMONI</span>
          </div>
          <div class="col-span-4 lg:col-span-6">
            <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[0.98] text-black text-left">
              Suara pelaku UMKM.
            </h2>
          </div>
          <div class="col-span-4 lg:col-span-4">
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed text-left">
              Lebih dari 120 usaha kuliner, kopi, kriya, dan perawatan lokal mempercayakan identitas kemasannya kepada Arc Lab.
            </p>
          </div>
        </div>
      </div>

      <!-- Single Large Left-Aligned Grotesk Quote (40-64px) -->
      <div v-reveal="80" class="swiss-grid">
        <div class="col-span-4 lg:col-start-3 lg:col-span-10">
          <div class="min-h-[240px] sm:min-h-[270px] lg:min-h-[300px] flex items-start">
            <Transition name="quote-swiss" mode="out-in">
              <blockquote
                :key="currentIndex"
                class="font-display text-[32px] sm:text-[42px] lg:text-[52px] xl:text-[60px] font-medium tracking-[-0.03em] leading-[1.12] text-black text-left"
              >
                “{{ currentReview.quote }}”
              </blockquote>
            </Transition>
          </div>

          <!-- Mono Attribution + Text Prev/Next Controls with Index "02 / 05" -->
          <div class="mt-10 pt-6 border-t border-black flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div class="text-left space-y-1.5">
              <div class="swiss-mono text-black font-semibold">
                {{ currentReview.name }} — {{ currentReview.business }}
              </div>
              <div class="swiss-mono text-signal">
                {{ currentReview.metric }}
              </div>
            </div>

            <div class="flex items-center gap-6 shrink-0" role="group" aria-label="Navigasi testimoni klien">
              <button
                type="button"
                aria-label="Testimoni sebelumnya"
                class="py-1 font-mono text-lg text-black hover:text-signal transition-colors duration-300 ease-out"
                @click="prevQuote"
              >
                ←
              </button>
              <span class="swiss-mono text-black tabular-nums" aria-live="polite">
                {{ formattedIndex }}
              </span>
              <button
                type="button"
                aria-label="Testimoni berikutnya"
                class="py-1 font-mono text-lg text-black hover:text-signal transition-colors duration-300 ease-out"
                @click="nextQuote"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
