<script setup lang="ts">
const items = [
  'Desain Logo Berkarakter',
  'Kemasan 3D Siap Cetak',
  'Selesai 2–4 Hari Kerja',
  'File Master AI · EPS · PDF · PNG',
  'Banner & Spanduk Presisi',
  'Kurasi Feed Instagram',
  'Konsultasi Konsep Gratis'
]
</script>

<template>
  <div
    class="w-full border-y border-espresso/10 bg-sand text-espresso py-5 overflow-hidden select-none"
    role="region"
    aria-label="Keunggulan layanan Arc Lab"
  >
    <div class="flex w-max animate-marquee hover:[animation-play-state:paused]">
      <div
        v-for="copy in 2"
        :key="copy"
        class="flex items-center gap-8 pr-8"
        :aria-hidden="copy === 2 ? 'true' : undefined"
      >
        <div
          v-for="(text, idx) in items"
          :key="`${copy}-${idx}`"
          class="flex items-center gap-8"
        >
          <span class="font-display italic font-light text-xl sm:text-2xl tracking-tight text-espresso/85">
            {{ text }}
          </span>
          <!-- Small Terracotta Arc + Dot Glyph -->
          <svg
            viewBox="0 0 24 24"
            class="w-4 h-4 text-terracotta shrink-0"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5.5 16.5 A8.5 8.5 0 1 1 18.5 16.5"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
            <circle cx="12" cy="12.5" r="2.3" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
