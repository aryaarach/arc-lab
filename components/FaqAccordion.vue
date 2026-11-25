<script setup lang="ts">
import { ref } from 'vue'

const openIndex = ref<number | null>(0)

const faqs = [
  {
    q: 'Bagaimana kalau saya belum punya konsep atau sketsa desain sama sekali?',
    a: 'Tenang, justru itu peran kami. Cukup ceritakan produk yang kamu jual, kisaran harga, dan siapa pembelinya lewat WhatsApp. Tim Arc Lab akan menyusun rekomendasi arah warna dan konsep awal secara gratis.'
  },
  {
    q: 'File apa saja yang saya terima setelah desain selesai?',
    a: 'Kamu memperoleh hak milik penuh beserta seluruh file master siap pakai: Adobe Illustrator (.AI), .EPS, .PDF siap cetak (CMYK), .SVG, serta gambar .PNG berlatar transparan dan mockup 3D resolusi tinggi.'
  },
  {
    q: 'Berapa lama waktu pengerjaan dan berapa kali jatah revisi?',
    a: 'Rata-rata konsep awal dikirim dalam 1–2 hari kerja, dan keseluruhan proses hingga serah terima berkisar 2–4 hari kerja. Setiap layanan sudah mencakup 3x sesi revisi terarah agar hasilnya benar-benar sreg.'
  },
  {
    q: 'Apakah ukuran desain kemasan dijamin pas saat dibawa ke percetakan?',
    a: 'Ya. Informasikan ukuran kemasan dari vendor percetakanmu (seperti standing pouch 14x22 cm, botol 250 ml, maupun dus custom). Kami siapkan garis potong (dieline) dan area lebihan cetak (bleed) sesuai standar industri.'
  },
  {
    q: 'Bagaimana sistem pembayarannya? Apakah aman 100% online?',
    a: 'Diskusi konsep awal 100% gratis tanpa komitmen. Setelah arah konsep disepakati untuk mulai digarap, cukup DP 50% melalui transfer bank atau QRIS resmi, dan pelunasan 50% dilakukan setelah pratinjau desain disetujui.'
  }
]

function toggle(idx: number) {
  openIndex.value = openIndex.value === idx ? null : idx
}
</script>

<template>
  <section id="faq" class="py-24 sm:py-28 px-4 sm:px-6 lg:px-8 bg-cream">
    <div class="max-w-4xl mx-auto">
      <div v-reveal class="text-center mb-14">
        <p class="editorial-eyebrow text-terracotta-deep mb-3">
          Tanya Jawab · Informasi Penting
        </p>
        <h2 class="font-display text-4xl sm:text-5xl font-normal tracking-tight leading-[1.08] text-espresso">
          Pertanyaan yang sering diajukan.
        </h2>
        <p class="mt-4 text-sm sm:text-base text-espresso/75 max-w-xl mx-auto leading-relaxed">
          Segala hal penting seputar alur pengerjaan, sesi revisi, hingga kelengkapan file siap cetak di Arc Lab.
        </p>
      </div>

      <!-- Hairline-Separated Accordion Rows -->
      <div v-reveal="80" class="border-t border-espresso/10 divide-y divide-espresso/10">
        <div
          v-for="(faq, idx) in faqs"
          :key="idx"
          class="py-2"
        >
          <h3>
            <button
              :id="`faq-btn-${idx}`"
              type="button"
              class="w-full py-5 text-left flex items-center justify-between gap-6 font-display text-xl sm:text-2xl font-normal text-espresso hover:text-terracotta-deep transition-colors duration-300 ease-editorial group"
              :aria-expanded="openIndex === idx ? 'true' : 'false'"
              :aria-controls="`faq-panel-${idx}`"
              @click="toggle(idx)"
            >
              <span class="leading-snug">{{ faq.q }}</span>

              <!-- Plus / Minus Rotating Hairline Circle -->
              <span
                class="w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ease-editorial"
                :class="
                  openIndex === idx
                    ? 'bg-terracotta-deep border-terracotta-deep text-cream rotate-180'
                    : 'bg-sand/60 border-espresso/15 text-espresso group-hover:border-terracotta/50'
                "
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8">
                  <line x1="4" y1="10" x2="16" y2="10" stroke-linecap="round" />
                  <line
                    x1="10"
                    y1="4"
                    x2="10"
                    y2="16"
                    stroke-linecap="round"
                    class="origin-center transition-transform duration-500 ease-editorial"
                    :class="openIndex === idx ? 'scale-y-0 rotate-90' : 'scale-y-100 rotate-0'"
                  />
                </svg>
              </span>
            </button>
          </h3>

          <!-- Smooth Height Animation via CSS Grid 0fr -> 1fr -->
          <div
            :id="`faq-panel-${idx}`"
            role="region"
            :aria-labelledby="`faq-btn-${idx}`"
            :inert="openIndex !== idx ? true : undefined"
            class="grid transition-all duration-500 ease-editorial"
            :class="
              openIndex === idx
                ? 'grid-rows-[1fr] opacity-100 pb-6'
                : 'grid-rows-[0fr] opacity-0 pb-0'
            "
          >
            <div class="overflow-hidden">
              <p class="pr-8 sm:pr-14 text-sm sm:text-base text-espresso/75 leading-relaxed">
                {{ faq.a }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
