<script setup lang="ts">
import { ref } from 'vue'

const openIndex = ref<number | null>(0)

const faqs = [
  {
    q: 'Bagaimana kalau saya belum punya konsep atau sketsa desain sama sekali?',
    a: 'Tenang, justru itu tugas kami! Cukup ceritakan produk yang kamu jual, kisaran harga produk, dan siapa pembelinya lewat WhatsApp. Tim Arc Lab akan menyusun rekomendasi gaya warna dan konsep awal secara gratis.'
  },
  {
    q: 'File apa saja yang saya terima setelah desain selesai?',
    a: 'Kamu mendapatkan hak milik penuh dan seluruh file master siap pakai: Adobe Illustrator (.AI), .EPS, .PDF siap cetak (CMYK), .SVG, serta gambar .PNG berlatar transparan dan mockup 3D resolusi tinggi.'
  },
  {
    q: 'Berapa lama waktu pengerjaan dan berapa kali jatah revisi?',
    a: 'Rata-rata konsep awal dikirim dalam 1–2 hari kerja, dan total selesai hingga serah terima berkisar 2–4 hari kerja. Setiap layanan sudah termasuk 3x sesi revisi terarah agar hasilnya benar-benar pas.'
  },
  {
    q: 'Apakah ukuran desain kemasan dijamin pas saat dibawa ke percetakan?',
    a: 'Ya! Informasikan ukuran kemasan dari vendor percetakanmu (atau jenis kemasan seperti standing pouch 14x22 cm, botol 250 ml, maupun box custom). Kami siapkan garis potong (dieline) dan bleed sesuai standar cetak.'
  },
  {
    q: 'Bagaimana sistem pembayarannya? Apakah aman 100% online?',
    a: 'Diskusi konsep awal 100% gratis tanpa komitmen. Setelah konsep disepakati untuk mulai digarap, cukup DP 50% melalui transfer bank atau QRIS resmi, dan pelunasan 50% dilakukan setelah pratinjau desain disetujui.'
  }
]

function toggle(idx: number) {
  openIndex.value = openIndex.value === idx ? null : idx
}
</script>

<template>
  <section id="faq" class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper">
    <div class="max-w-4xl mx-auto">
      <div v-reveal class="text-center mb-12">
        <span class="brutal-tag bg-cyan text-ink mb-3">TANYA JAWAB // LAB 07</span>
        <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Pertanyaan yang Sering Diajukan
        </h2>
        <p class="mt-3 text-sm sm:text-base text-ink/80 max-w-xl mx-auto">
          Semua hal penting seputar alur pengerjaan, revisi, hingga kelengkapan file cetak di Arc Lab.
        </p>
      </div>

      <div class="flex flex-col gap-4">
        <div
          v-for="(faq, idx) in faqs"
          :key="idx"
          v-reveal="idx * 50"
          class="brutal-card bg-paper overflow-hidden"
        >
          <h3>
            <button
              :id="`faq-btn-${idx}`"
              type="button"
              class="w-full px-5 sm:px-6 py-5 text-left flex items-center justify-between gap-4 font-display font-bold text-base sm:text-lg hover:bg-yellow/35 transition-colors"
              :aria-expanded="openIndex === idx ? 'true' : 'false'"
              :aria-controls="`faq-panel-${idx}`"
              @click="toggle(idx)"
            >
              <span>{{ faq.q }}</span>
              <span
                class="w-9 h-9 border-2 border-ink flex items-center justify-center font-mono text-lg font-bold shrink-0 transition-colors"
                :class="openIndex === idx ? 'bg-coral text-paper' : 'bg-yellow text-ink'"
                aria-hidden="true"
              >
                {{ openIndex === idx ? '−' : '+' }}
              </span>
            </button>
          </h3>

          <div
            v-show="openIndex === idx"
            :id="`faq-panel-${idx}`"
            role="region"
            :aria-labelledby="`faq-btn-${idx}`"
            class="px-5 sm:px-6 pb-6 pt-3 border-t-2 border-ink bg-paper-dark/40 text-sm sm:text-base text-ink/85 leading-relaxed"
          >
            {{ faq.a }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
