<script setup lang="ts">
const items = [
  'DESAIN LOGO UMKM',
  'KEMASAN 3D SIAP CETAK',
  'SELESAI 2–4 HARI KERJA',
  'FILE MASTER AI · EPS · PDF · PNG',
  'BANNER & SPANDUK TAJAM',
  'TEMPLATE FEED INSTAGRAM',
  'KONSULTASI KONSEP GRATIS'
]
</script>

<template>
  <div
    class="w-full bg-black text-white border-y border-black py-4 overflow-hidden select-none"
    role="region"
    aria-label="Keunggulan layanan Arc Lab"
  >
    <div class="flex w-max animate-marquee hover:[animation-play-state:paused]">
      <div
        v-for="copy in 2"
        :key="copy"
        class="flex items-center"
        :aria-hidden="copy === 2 ? 'true' : undefined"
      >
        <div
          v-for="(item, idx) in items"
          :key="`${copy}-${idx}`"
          class="flex items-center"
        >
          <span class="font-display text-sm sm:text-base font-medium uppercase tracking-[0.06em] text-white whitespace-nowrap">
            {{ item }}
          </span>
          <span class="font-mono text-base sm:text-lg font-medium text-signal px-5 sm:px-7" aria-hidden="true">
            /
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
