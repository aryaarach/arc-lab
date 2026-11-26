<script setup lang="ts">
import { ref } from 'vue'

const openIndex = ref<number | null>(0)

const faqs = [
  {
    q: 'Bagaimana jika saya belum memiliki konsep atau sketsa desain sama sekali?',
    a: 'Tidak masalah. Cukup ceritakan produk yang dijual, kisaran harga produk, dan target pembelinya lewat WhatsApp. Tim Arc Lab akan menyusun rekomendasi arah warna, tipografi, dan konsep awal secara gratis.'
  },
  {
    q: 'File apa saja yang saya terima setelah desain selesai?',
    a: 'Kamu menerima hak milik penuh beserta seluruh file master siap pakai: Adobe Illustrator (.AI), .EPS, .PDF siap cetak (CMYK), .SVG, serta gambar .PNG berlatar transparan dan mockup 3D resolusi tinggi.'
  },
  {
    q: 'Berapa lama waktu pengerjaan dan berapa kali jatah revisi?',
    a: 'Konsep awal dikirim dalam 1–2 hari kerja, dan keseluruhan proses hingga serah terima berkisar 2–4 hari kerja. Setiap layanan sudah mencakup 3x sesi revisi terarah.'
  },
  {
    q: 'Apakah ukuran desain kemasan dijamin presisi saat dibawa ke percetakan?',
    a: 'Ya. Informasikan dimensi kemasan dari vendor percetakanmu (seperti standing pouch 14x22 cm, botol 250 ml, atau dus custom). Kami menyiapkan pola garis potong (dieline) dan area lebihan cetak (bleed) sesuai standar industri.'
  },
  {
    q: 'Bagaimana sistem pembayarannya untuk pemesanan daring?',
    a: 'Diskusi pemetaan konsep awal 100% gratis tanpa komitmen. Setelah konsep disepakati, pengerjaan dimulai dengan uang muka (DP) 50% melalui transfer bank atau QRIS resmi, dan pelunasan 50% dilakukan setelah pratinjau desain disetujui.'
  }
]

function toggle(idx: number) {
  openIndex.value = openIndex.value === idx ? null : idx
}
</script>

<template>
  <section id="faq" class="py-20 sm:py-28 lg:py-32 bg-white">
    <div class="swiss-container">
      <!-- Numbered Swiss Section Header (Left-Aligned) -->
      <div v-reveal class="mb-14 sm:mb-16">
        <div class="swiss-section-rule mb-5"></div>
        <div class="swiss-grid gap-y-6 items-end">
          <div class="col-span-4 lg:col-span-2">
            <span class="swiss-mono text-signal">07 / FAQ</span>
          </div>
          <div class="col-span-4 lg:col-span-6">
            <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[0.98] text-black text-left">
              Pertanyaan umum.
            </h2>
          </div>
          <div class="col-span-4 lg:col-span-4">
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed text-left">
              Rincian teknis seputar alur pengerjaan, revisi, spesifikasi cetak, dan kelengkapan file master di Arc Lab.
            </p>
          </div>
        </div>
      </div>

      <!-- 12-Col Grid: Accordion Rows Spanning Cols 3-12 -->
      <div class="swiss-grid">
        <div class="col-span-4 lg:col-start-3 lg:col-span-10 border-t border-black">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            v-reveal="idx * 45"
            class="border-b border-line"
          >
            <h3>
              <button
                :id="`faq-btn-${idx}`"
                type="button"
                class="group w-full py-6 text-left flex items-start justify-between gap-6 transition-colors duration-300 ease-out"
                :aria-expanded="openIndex === idx ? 'true' : 'false'"
                :aria-controls="`faq-panel-${idx}`"
                @click="toggle(idx)"
              >
                <div class="flex items-baseline gap-4 sm:gap-6">
                  <span
                    class="swiss-mono shrink-0 transition-colors duration-300"
                    :class="openIndex === idx ? 'text-signal font-semibold' : 'text-mid-gray group-hover:text-black'"
                  >
                    {{ String(idx + 1).padStart(2, '0') }}
                  </span>
                  <span class="font-display text-lg sm:text-2xl font-medium tracking-[-0.02em] text-black group-hover:text-signal transition-colors duration-300 text-left">
                    {{ faq.q }}
                  </span>
                </div>

                <span
                  class="font-mono text-xl leading-none shrink-0 pt-0.5 transition-colors duration-300"
                  :class="openIndex === idx ? 'text-signal' : 'text-black group-hover:text-signal'"
                  aria-hidden="true"
                >
                  {{ openIndex === idx ? '−' : '+' }}
                </span>
              </button>
            </h3>

            <!-- Smooth Height Transition via CSS Grid 0fr -> 1fr -->
            <div
              :id="`faq-panel-${idx}`"
              role="region"
              :aria-labelledby="`faq-btn-${idx}`"
              :inert="openIndex !== idx || undefined"
              class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
              :class="openIndex === idx ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
            >
              <div class="overflow-hidden">
                <p class="pb-6 pl-8 sm:pl-11 pr-6 text-sm sm:text-base text-dark-gray leading-relaxed text-left max-w-3xl">
                  {{ faq.a }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
