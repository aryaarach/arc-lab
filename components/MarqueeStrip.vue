<script setup lang="ts">
const items = [
  { text: 'DESAIN LOGO UMKM', color: 'bg-yellow' },
  { text: 'KEMASAN 3D SIAP CETAK', color: 'bg-cyan' },
  { text: 'SELESAI 2–4 HARI KERJA', color: 'bg-coral text-paper' },
  { text: 'FILE MASTER AI · EPS · PDF · PNG', color: 'bg-indigo text-paper' },
  { text: 'BANNER & SPANDUK TAJAM', color: 'bg-yellow' },
  { text: 'TEMPLATE FEED INSTAGRAM', color: 'bg-cyan' },
  { text: 'KONSULTASI KONSEP GRATIS', color: 'bg-coral text-paper' }
]
</script>

<template>
  <div class="w-full border-y-2 border-ink bg-ink text-paper py-3.5 overflow-hidden select-none" role="region" aria-label="Keunggulan layanan Arc Lab">
    <div class="flex w-max animate-marquee hover:[animation-play-state:paused]">
      <div v-for="copy in 2" :key="copy" class="flex items-center gap-4 pr-4" :aria-hidden="copy === 2 ? 'true' : undefined">
        <div
          v-for="(item, idx) in items"
          :key="`${copy}-${idx}`"
          class="flex items-center gap-4"
        >
          <span
            class="inline-block px-3 py-1 border-2 border-paper font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-ink"
            :class="item.color"
          >
            {{ item.text }}
          </span>
          <span class="text-yellow font-display font-bold text-lg" aria-hidden="true">✦</span>
        </div>
      </div>
    </div>
  </div>
</template>
