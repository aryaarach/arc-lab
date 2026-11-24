<script setup lang="ts">
import { ref } from 'vue'

const position = ref(52)
const isDragging = ref(false)
const trackRef = ref<HTMLElement | null>(null)

function clamp(val: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, val))
}

function updateFromClientX(clientX: number) {
  const el = trackRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0) return
  const pct = ((clientX - rect.left) / rect.width) * 100
  position.value = clamp(pct, 2, 98)
}

function onPointerDown(e: PointerEvent) {
  isDragging.value = true
  ;(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId)
  updateFromClientX(e.clientX)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  updateFromClientX(e.clientX)
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  ;(e.currentTarget as HTMLElement)?.releasePointerCapture?.(e.pointerId)
}

function onKeyDown(e: KeyboardEvent) {
  const step = e.shiftKey ? 10 : 4
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    position.value = clamp(position.value - step, 0, 100)
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    position.value = clamp(position.value + step, 0, 100)
  } else if (e.key === 'Home') {
    e.preventDefault()
    position.value = 0
  } else if (e.key === 'End') {
    e.preventDefault()
    position.value = 100
  }
}
</script>

<template>
  <section id="transformasi" class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper">
    <div class="max-w-7xl mx-auto">
      <!-- Section Header -->
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span class="brutal-tag bg-coral text-paper mb-3">STUDI KASUS // LAB 03</span>
          <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Sebelum vs Sesudah Rebranding
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-ink/80">
          Geser pembatas di bawah (atau gunakan tombol panah kiri/kanan pada keyboard) untuk melihat bagaimana kemasan produk yang sama naik kelas di rak toko.
        </p>
      </div>

      <!-- Interactive Comparison Stage -->
      <div v-reveal="100" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-8">
          <div
            ref="trackRef"
            data-cursor-grow
            class="relative w-full aspect-[4/3] sm:aspect-[16/10] border-2 border-ink shadow-brutal-lg overflow-hidden select-none touch-pan-y bg-paper-dark"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <!-- LAYER 1: BEFORE (Base Full Width) -->
            <div class="absolute inset-0 w-full h-full bg-[#E5E2DC] flex items-center justify-center p-4">
              <svg
                viewBox="0 0 800 500"
                class="w-full h-full"
                role="img"
                aria-label="Desain kemasan lama sebelum rebranding: plastik polos dengan stiker seadanya yang kurang terbaca"
              >
                <rect width="800" height="500" fill="#DDD9D0" />
                <!-- Dull background grid -->
                <g stroke="#B8B3A8" stroke-width="1">
                  <line x1="0" y1="400" x2="800" y2="400" />
                  <line x1="120" y1="0" x2="120" y2="500" />
                  <line x1="680" y1="0" x2="680" y2="500" />
                </g>

                <!-- Plain Plastic Pouch -->
                <rect x="255" y="65" width="290" height="375" rx="22" fill="#EDEAE2" stroke="#8C877E" stroke-width="3" />
                <line x1="255" y1="108" x2="545" y2="108" stroke="#A6A197" stroke-width="2" stroke-dasharray="6 6" />
                <!-- Generic monochrome sticker -->
                <rect x="292" y="168" width="216" height="175" fill="#FAF8F5" stroke="#99948B" stroke-width="2" />
                <text x="400" y="206" text-anchor="middle" font-family="serif" font-size="18" fill="#57544F">Keripik Singkong</text>
                <text x="400" y="236" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="#44423E">"BU RINI"</text>
                <line x1="316" y1="252" x2="484" y2="252" stroke="#B5B0A6" stroke-width="1.5" />
                <text x="400" y="278" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#6E6A63">Rasa Balado Pedas Manis</text>
                <text x="400" y="302" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#8A857C">Enak, Gurih, Renyah Tanpa Pengawet</text>
                <text x="400" y="326" text-anchor="middle" font-family="monospace" font-size="11" fill="#8A857C">Hub: 0812-xxxx-xxxx</text>

                <!-- Callout notes -->
                <g>
                  <rect x="44" y="140" width="176" height="62" fill="#FAF8F5" stroke="#7A756C" stroke-width="2" />
                  <text x="60" y="166" font-family="monospace" font-size="12" font-weight="700" fill="#57544F">✕ KURANG KONTRAS</text>
                  <text x="60" y="186" font-family="sans-serif" font-size="12" fill="#6E6A63">Sulit dilirik di etalase</text>

                  <rect x="578" y="250" width="180" height="62" fill="#FAF8F5" stroke="#7A756C" stroke-width="2" />
                  <text x="594" y="276" font-family="monospace" font-size="12" font-weight="700" fill="#57544F">✕ TANPA HIERARKI</text>
                  <text x="594" y="296" font-family="sans-serif" font-size="12" fill="#6E6A63">Teks menumpuk &amp; kecil</text>
                </g>
              </svg>

              <span class="absolute top-3 right-3 px-3 py-1 bg-paper border-2 border-ink font-mono text-xs font-bold uppercase shadow-brutal-sm">
                SEBELUM · Kemasan Polos
              </span>
            </div>

            <!-- LAYER 2: AFTER (Clipped by position%) -->
            <div
              class="absolute inset-0 w-full h-full bg-[#22E6D0] flex items-center justify-center p-4"
              :style="{ clipPath: `inset(0 ${100 - position}% 0 0)` }"
            >
              <svg
                viewBox="0 0 800 500"
                class="w-full h-full"
                role="img"
                aria-label="Desain kemasan baru hasil rebranding Arc Lab: warna cerah, tipografi tegas, ilustrasi modern, dan siap masuk ritel modern"
              >
                <rect width="800" height="500" fill="#22E6D0" />
                <!-- Neo-Brutalist Lab Grid -->
                <g stroke="#0B0B0F" stroke-opacity="0.12" stroke-width="1.5">
                  <line x1="0" y1="100" x2="800" y2="100" />
                  <line x1="0" y1="200" x2="800" y2="200" />
                  <line x1="0" y1="300" x2="800" y2="300" />
                  <line x1="0" y1="400" x2="800" y2="400" />
                  <line x1="160" y1="0" x2="160" y2="500" />
                  <line x1="640" y1="0" x2="640" y2="500" />
                </g>

                <!-- Hard shadow behind upgraded pouch -->
                <rect x="267" y="69" width="290" height="382" rx="22" fill="#0B0B0F" />
                <!-- Upgraded Full-Print Standing Pouch -->
                <rect x="255" y="57" width="290" height="382" rx="22" fill="#FFD84D" stroke="#0B0B0F" stroke-width="4" />
                <!-- Top Tear Notch Header -->
                <path d="M255 79 Q255 57 277 57 L523 57 Q545 57 545 79 L545 112 L255 112 Z" fill="#0B0B0F" />
                <text x="400" y="91" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="#FFD84D">ZIP-LOCK SEGAR · KUALITAS PREMIUM</text>

                <!-- Brand Arc Emblem -->
                <circle cx="400" cy="162" r="32" fill="#5B5BFF" stroke="#0B0B0F" stroke-width="3.5" />
                <path d="M384 170 A18 18 0 1 1 416 170" fill="none" stroke="#F4F1EA" stroke-width="4" stroke-linecap="round" />
                <circle cx="400" cy="162" r="5" fill="#FFD84D" />

                <!-- Bold Brand Name -->
                <rect x="280" y="206" width="240" height="84" fill="#F4F1EA" stroke="#0B0B0F" stroke-width="3.5" />
                <text x="400" y="242" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="900" fill="#0B0B0F">KRIUK RINI</text>
                <text x="400" y="272" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="#5B5BFF">SINGKONG REMPAH ASLI</text>

                <!-- Variant Pill -->
                <rect x="296" y="308" width="208" height="44" rx="22" fill="#FF6B4A" stroke="#0B0B0F" stroke-width="3.5" />
                <text x="400" y="336" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="800" fill="#F4F1EA">🔥 BALADO DAUN JERUK</text>

                <!-- Bottom Info Strip -->
                <text x="315" y="408" font-family="monospace" font-size="13" font-weight="700" fill="#0B0B0F">NETTO 200G</text>
                <rect x="438" y="390" width="80" height="26" fill="#0B0B0F" />
                <text x="478" y="408" text-anchor="middle" font-family="monospace" font-size="12" font-weight="700" fill="#22E6D0">HALAL ID</text>

                <!-- Positive Callouts -->
                <g>
                  <rect x="44" y="144" width="184" height="66" fill="#0B0B0F" />
                  <rect x="38" y="138" width="184" height="66" fill="#F4F1EA" stroke="#0B0B0F" stroke-width="3" />
                  <text x="54" y="165" font-family="monospace" font-size="12" font-weight="700" fill="#5B5BFF">✓ IDENTITAS KUAT</text>
                  <text x="54" y="187" font-family="sans-serif" font-size="13" font-weight="700" fill="#0B0B0F">Langsung menonjol!</text>

                  <rect x="582" y="254" width="184" height="66" fill="#0B0B0F" />
                  <rect x="576" y="248" width="184" height="66" fill="#FFD84D" stroke="#0B0B0F" stroke-width="3" />
                  <text x="592" y="275" font-family="monospace" font-size="12" font-weight="700" fill="#0B0B0F">✓ SIAP RITEL MODERN</text>
                  <text x="592" y="297" font-family="sans-serif" font-size="13" font-weight="700" fill="#0B0B0F">PIRT &amp; varian jelas</text>
                </g>
              </svg>

              <span class="absolute top-3 left-3 px-3 py-1 bg-yellow border-2 border-ink font-mono text-xs font-bold uppercase shadow-brutal-sm">
                SESUDAH · Arc Lab Redesign
              </span>
            </div>

            <!-- Draggable Vertical Divider + Accessible Handle -->
            <div
              class="absolute inset-y-0 z-20 w-1 bg-ink pointer-events-none"
              :style="{ left: `${position}%` }"
            >
              <button
                type="button"
                role="slider"
                tabindex="0"
                aria-label="Penggeser perbandingan sebelum dan sesudah rebranding"
                :aria-valuemin="0"
                :aria-valuemax="100"
                :aria-valuenow="Math.round(position)"
                :aria-valuetext="`${Math.round(position)} persen tampilan sesudah rebranding`"
                class="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-yellow hover:bg-coral hover:text-paper border-2 border-ink shadow-brutal-sm flex items-center justify-center font-mono font-bold text-sm cursor-ew-resize focus:outline-none focus:ring-4 focus:ring-indigo"
                @keydown="onKeyDown"
              >
                ↔
              </button>
            </div>
          </div>
        </div>

        <!-- Impact Summary Card (4 cols) -->
        <div v-reveal="180" class="lg:col-span-4 flex flex-col gap-5">
          <div class="brutal-card bg-yellow p-6">
            <div class="font-mono text-xs font-bold uppercase tracking-wider mb-2">DAMPAK NYATA DI PASAR</div>
            <h3 class="font-display text-2xl font-bold leading-snug mb-3">
              Produk enak saja belum cukup kalau pembeli ragu mencoba.
            </h3>
            <p class="text-sm text-ink/85 leading-relaxed">
              Kemasan yang rapi menaikkan nilai jual produk UMKM Rp5.000–Rp15.000 per bungkus tanpa mengubah resep di dalamnya.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="brutal-card p-4 bg-paper">
              <div class="font-display text-3xl font-bold text-indigo">3,2x</div>
              <div class="font-mono text-xs text-ink/75 mt-1">Lebih sering diklik di katalog Shopee</div>
            </div>
            <div class="brutal-card p-4 bg-paper">
              <div class="font-display text-3xl font-bold text-coral">100%</div>
              <div class="font-mono text-xs text-ink/75 mt-1">Siap masuk toko oleh-oleh &amp; kafe</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
