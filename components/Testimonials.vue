<script setup lang="ts">
const reviews = [
  {
    name: 'Teh Rini Suryani',
    business: 'Kriuk Singkong Rempah · Bandung',
    badge: 'Omzet Naik 2x',
    avatarBg: 'bg-yellow',
    initials: 'RS',
    quote:
      'Dulu keripik saya cuma pakai plastik bening dan stiker hitam putih, sering ditolak toko oleh-oleh. Setelah digarap ulang kemasan dan logonya oleh Arc Lab, langsung diterima di 9 toko besar!'
  },
  {
    name: 'Dimas Prakoso',
    business: 'Kopi Titik Kumpul · Yogyakarta',
    badge: 'Selesai 3 Hari',
    avatarBg: 'bg-cyan',
    initials: 'DP',
    quote:
      'Paling suka sama kecepatan dan komunikasinya. Belum punya bayangan konsep pun tetap dibantu cari referensi warna sampai pas. File kaleng dan cup langsung siap naik cetak tanpa revisi ukuran dari percetakan.'
  },
  {
    name: 'Nadia Maharani',
    business: 'Lumea Sabun Alami · Surabaya',
    badge: 'Paket Kombo Rp499rb',
    avatarBg: 'bg-coral text-paper',
    initials: 'NM',
    quote:
      'Ambil Paket Kombo Rp499.000 benar-benar balik modal cepat. Dapat logo, dus kemasan, banner bazar, sampai template feed Instagram yang bikin akun bisnis baru saya kelihatan seperti brand mapan.'
  }
]
</script>

<template>
  <section id="testimoni" class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper-dark/60">
    <div class="max-w-7xl mx-auto">
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <span class="brutal-tag bg-indigo text-paper mb-3">CERITA KLIEN // LAB 06</span>
          <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Dipercaya Pelaku UMKM Indonesia
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-ink/80">
          Lebih dari 150 brand kuliner, fesyen lokal, kriya, dan produk herbal telah merapikan tampilan visualnya bersama Arc Lab.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article
          v-for="(rev, idx) in reviews"
          :key="rev.name"
          v-reveal="idx * 80"
          class="brutal-card p-6 sm:p-7 flex flex-col justify-between gap-6 bg-paper"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <div class="font-mono text-sm tracking-widest text-ink" aria-label="Rating 5 dari 5 bintang">
                ★★★★★
              </div>
              <span class="px-2.5 py-1 bg-yellow border-2 border-ink font-mono text-[11px] font-bold uppercase">
                {{ rev.badge }}
              </span>
            </div>

            <blockquote class="text-sm sm:text-base text-ink/90 leading-relaxed">
              “{{ rev.quote }}”
            </blockquote>
          </div>

          <div class="pt-4 border-t-2 border-ink flex items-center gap-3.5">
            <div
              class="w-11 h-11 border-2 border-ink font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-brutal-sm"
              :class="rev.avatarBg"
              aria-hidden="true"
            >
              {{ rev.initials }}
            </div>
            <div>
              <div class="font-display font-bold text-base leading-tight">{{ rev.name }}</div>
              <div class="font-mono text-xs text-ink/70 mt-0.5">{{ rev.business }}</div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
