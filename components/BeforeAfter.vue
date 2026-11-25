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
  <section id="transformasi" class="py-24 sm:py-28 px-4 sm:px-6 lg:px-8 bg-cream">
    <div class="max-w-7xl mx-auto">
      <!-- Section Header -->
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div class="max-w-xl">
          <p class="editorial-eyebrow text-terracotta-deep mb-3">
            Studi Kasus · Transformasi Kemasan
          </p>
          <h2 class="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-normal tracking-tight leading-[1.06] text-espresso">
            Sebelum &amp; sesudah sentuhan editorial.
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-espresso/75 leading-relaxed">
          Geser pembatas di bawah (atau gunakan tombol panah kiri/kanan pada keyboard) untuk melihat bagaimana produk yang sama naik kelas di etalase toko modern.
        </p>
      </div>

      <!-- Interactive Comparison Stage -->
      <div v-reveal="100" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-8">
          <div
            ref="trackRef"
            data-cursor-grow
            class="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-[28px] border border-espresso/10 shadow-editorial-lg overflow-hidden select-none touch-pan-y bg-sand"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <!-- LAYER 1: BEFORE (Base Full Width) -->
            <div class="absolute inset-0 w-full h-full bg-[#E5E0D6] flex items-center justify-center p-4">
              <svg
                viewBox="0 0 800 500"
                class="w-full h-full"
                role="img"
                aria-label="Desain kemasan lama sebelum rebranding: plastik polos dengan stiker seadanya yang kurang terbaca"
              >
                <rect width="800" height="500" fill="#E3DED4" />
                <g stroke="#C6BFB2" stroke-width="1">
                  <line x1="0" y1="408" x2="800" y2="408" />
                </g>

                <!-- Plain Plastic Pouch -->
                <rect x="255" y="65" width="290" height="375" rx="26" fill="#EFECE5" stroke="#ACA599" stroke-width="2" />
                <line x1="255" y1="108" x2="545" y2="108" stroke="#BCB5A9" stroke-width="1.5" stroke-dasharray="6 6" />
                <!-- Generic monochrome sticker -->
                <rect x="292" y="168" width="216" height="175" rx="6" fill="#FAF8F5" stroke="#B5AEA2" stroke-width="1.5" />
                <text x="400" y="206" text-anchor="middle" font-family="serif" font-size="18" fill="#5D5751">Keripik Singkong</text>
                <text x="400" y="236" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="#46413C">"BU RINI"</text>
                <line x1="316" y1="252" x2="484" y2="252" stroke="#C5BEB2" stroke-width="1" />
                <text x="400" y="278" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#6E6861">Rasa Balado Pedas Manis</text>
                <text x="400" y="302" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#8A837B">Enak, Gurih, Renyah Tanpa Pengawet</text>
                <text x="400" y="326" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#8A837B">Hub: 0812-xxxx-xxxx</text>

                <!-- Muted Callout Notes -->
                <g>
                  <rect x="44" y="140" width="178" height="62" rx="14" fill="#FAF7F2" stroke="#BFB8AC" stroke-width="1" />
                  <text x="62" y="166" font-family="Inter, sans-serif" font-size="11" font-weight="600" letter-spacing="1" fill="#7A6E65">KURANG KONTRAS</text>
                  <text x="62" y="186" font-family="Inter, sans-serif" font-size="12" fill="#5E564F">Tenggelam di etalase</text>

                  <rect x="576" y="250" width="182" height="62" rx="14" fill="#FAF7F2" stroke="#BFB8AC" stroke-width="1" />
                  <text x="594" y="276" font-family="Inter, sans-serif" font-size="11" font-weight="600" letter-spacing="1" fill="#7A6E65">TANPA HIERARKI</text>
                  <text x="594" y="296" font-family="Inter, sans-serif" font-size="12" fill="#5E564F">Informasi menumpuk</text>
                </g>
              </svg>

              <span class="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-cream/90 backdrop-blur-md border border-espresso/10 text-xs font-medium text-espresso/75">
                Sebelum · Kemasan Polos
              </span>
            </div>

            <!-- LAYER 2: AFTER (Clipped by position%) -->
            <div
              class="absolute inset-0 w-full h-full bg-[#EFE8DC] flex items-center justify-center p-4"
              :style="{ clipPath: `inset(0 ${100 - position}% 0 0)` }"
            >
              <svg
                viewBox="0 0 800 500"
                class="w-full h-full"
                role="img"
                aria-label="Desain kemasan baru hasil rebranding Arc Lab: palet hangat premium, tipografi editorial Fraunces, dan siap masuk ritel modern"
              >
                <defs>
                  <linearGradient id="afterStudioBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#F5EFE4" />
                    <stop offset="60%" stop-color="#EFE8DC" />
                    <stop offset="100%" stop-color="#E4DAC9" />
                  </linearGradient>
                  <radialGradient id="pouchDrop" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#1F1A17" stop-opacity="0.28" />
                    <stop offset="100%" stop-color="#1F1A17" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <rect width="800" height="500" fill="url(#afterStudioBg)" />
                <!-- Soft Botanical Accent Halo -->
                <circle cx="400" cy="250" r="215" fill="#F2D98D" fill-opacity="0.28" />
                <ellipse cx="400" cy="448" rx="155" ry="22" fill="url(#pouchDrop)" />

                <!-- Upgraded Warm Artisan Standing Pouch -->
                <rect x="255" y="56" width="290" height="384" rx="28" fill="#1F1A17" />
                <!-- Top Terracotta Band -->
                <path d="M255 84 Q255 56 283 56 L517 56 Q545 56 545 84 L545 108 L255 108 Z" fill="#C8553D" />
                <text x="400" y="88" text-anchor="middle" font-family="Inter, sans-serif" font-size="10.5" font-weight="600" letter-spacing="2" fill="#FAF7F2">
                  KEMASAN KEDAP UDARA · KUALITAS PREMIUM
                </text>

                <!-- Inner Cream Editorial Label Card -->
                <rect x="279" y="130" width="242" height="258" rx="18" fill="#FAF7F2" />
                <rect x="291" y="142" width="218" height="234" rx="12" fill="none" stroke="#C8553D" stroke-opacity="0.35" stroke-width="1" />

                <!-- Terracotta Arc Emblem -->
                <path d="M386 190 A16 16 0 1 1 414 190" fill="none" stroke="#C8553D" stroke-width="3.2" stroke-linecap="round" />
                <circle cx="400" cy="180" r="4" fill="#C8553D" />

                <!-- Editorial Serif Brand Name -->
                <text x="400" y="236" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="31" font-weight="600" fill="#1F1A17">
                  Kriuk Rini
                </text>
                <text x="400" y="261" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="14" font-style="italic" fill="#A93F29">
                  Singkong Rempah Pilihan
                </text>

                <!-- Variant Pill -->
                <rect x="312" y="286" width="176" height="36" rx="18" fill="#F2D98D" />
                <text x="400" y="309" text-anchor="middle" font-family="Inter, sans-serif" font-size="11.5" font-weight="600" letter-spacing="0.8" fill="#1F1A17">
                  BALADO DAUN JERUK
                </text>

                <!-- Spec Footer on Label -->
                <text x="400" y="355" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="500" letter-spacing="1.4" fill="#5D554E">
                  BERAT BERSIH 200G · HALAL ID
                </text>

                <!-- Bottom Espresso Pouch Trim -->
                <text x="400" y="418" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" letter-spacing="1.8" fill="#EFE8DC" fill-opacity="0.75">
                  DIPRODUKSI ASLI BANDUNG
                </text>

                <!-- Positive Editorial Callouts -->
                <g>
                  <rect x="38" y="138" width="188" height="66" rx="18" fill="#FAF7F2" stroke="#1F1A17" stroke-opacity="0.1" stroke-width="1" />
                  <text x="58" y="165" font-family="Inter, sans-serif" font-size="10.5" font-weight="600" letter-spacing="1.4" fill="#A93F29">✓ IDENTITAS HANGAT</text>
                  <text x="58" y="186" font-family="Fraunces, Georgia, serif" font-size="14" font-weight="500" fill="#1F1A17">Langsung memikat mata</text>

                  <rect x="574" y="248" width="190" height="66" rx="18" fill="#FAF7F2" stroke="#1F1A17" stroke-opacity="0.1" stroke-width="1" />
                  <text x="594" y="275" font-family="Inter, sans-serif" font-size="10.5" font-weight="600" letter-spacing="1.4" fill="#475A43">✓ SIAP RITEL MODERN</text>
                  <text x="594" y="296" font-family="Fraunces, Georgia, serif" font-size="14" font-weight="500" fill="#1F1A17">PIRT &amp; varian jelas</text>
                </g>
              </svg>

              <span class="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-espresso/90 backdrop-blur-md text-cream text-xs font-medium shadow-editorial-sm">
                Sesudah · Arc Lab Redesign
              </span>
            </div>

            <!-- Draggable Hairline Vertical Divider + Slim Circular Arc Handle -->
            <div
              class="absolute inset-y-0 z-20 w-[1.5px] bg-cream shadow-[0_0_0_1px_rgba(31,26,23,0.18)] pointer-events-none"
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
                class="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-cream hover:bg-espresso text-terracotta hover:text-cream border border-espresso/15 shadow-editorial flex items-center justify-center cursor-ew-resize transition-colors duration-300 ease-editorial"
                @keydown="onKeyDown"
              >
                <svg viewBox="0 0 28 28" class="w-6 h-6" fill="none" aria-hidden="true">
                  <path
                    d="M9.5 18.5 A6.5 6.5 0 1 1 18.5 18.5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <circle cx="14" cy="14.5" r="2" fill="currentColor" />
                  <path
                    d="M4.5 14L2.5 14M25.5 14L23.5 14"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Impact Summary Column (4 cols) -->
        <div v-reveal="180" class="lg:col-span-4 flex flex-col gap-5">
          <div class="rounded-[26px] bg-sand border border-espresso/10 shadow-editorial p-7 sm:p-8">
            <p class="editorial-eyebrow text-terracotta-deep mb-3">Dampak di Pasar</p>
            <h3 class="font-display text-2xl sm:text-[1.75rem] font-normal leading-snug text-espresso mb-3">
              Rasa lezat layak didukung kemasan yang menumbuhkan percaya.
            </h3>
            <p class="text-sm sm:text-base text-espresso/75 leading-relaxed">
              Kemasan yang tertata rapi menaikkan nilai jual produk UMKM Rp5.000–Rp15.000 per bungkus tanpa mengubah resep di dalamnya.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-[24px] p-5 bg-butter-soft border border-espresso/10 shadow-editorial-sm">
              <div class="font-display text-3xl sm:text-4xl font-medium text-espresso">3,2x</div>
              <div class="text-xs sm:text-sm text-espresso/75 mt-1.5 leading-snug">
                Lebih sering diklik di katalog marketplace
              </div>
            </div>
            <div class="rounded-[24px] p-5 bg-sage-soft border border-espresso/10 shadow-editorial-sm">
              <div class="font-display text-3xl sm:text-4xl font-medium text-espresso">100%</div>
              <div class="text-xs sm:text-sm text-espresso/75 mt-1.5 leading-snug">
                Siap masuk butik oleh-oleh &amp; kafe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
