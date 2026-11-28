<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { drawLabel } from '~/utils/labelCanvas'

const { brandName, vibe, colorHex, finish } = useBrandState()
const displayBrand = computed(() => (brandName.value.trim() || 'KOPI SENJA').slice(0, 18).toUpperCase())

const position = ref(52)
const isDragging = ref(false)
const trackRef = ref<HTMLElement | null>(null)
const afterLabelDataUrl = ref('')

let renderToken = 0

async function refreshAfterArtwork() {
  if (typeof document === 'undefined') return
  const token = ++renderToken
  const canvas = await drawLabel(displayBrand.value, vibe.value, colorHex.value, 'front', 0.72)
  if (token !== renderToken) return
  afterLabelDataUrl.value = canvas.toDataURL('image/png')
}

onMounted(() => {
  refreshAfterArtwork()
})

watch([displayBrand, vibe, colorHex], () => {
  refreshAfterArtwork()
})

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
                aria-label="Desain kemasan lama Kopi Senja sebelum rebranding: pouch polos dengan stiker monokrom seadanya yang kurang terbaca"
              >
                <defs>
                  <linearGradient id="beforePouchShade" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#DCD7CE" />
                    <stop offset="18%" stop-color="#EFECE5" />
                    <stop offset="82%" stop-color="#E7E3DA" />
                    <stop offset="100%" stop-color="#D2CDC3" />
                  </linearGradient>
                </defs>

                <rect width="800" height="500" fill="#DDD9D0" />
                <!-- Dull background grid -->
                <g stroke="#B8B3A8" stroke-width="1">
                  <line x1="0" y1="418" x2="800" y2="418" />
                  <line x1="120" y1="0" x2="120" y2="500" />
                  <line x1="680" y1="0" x2="680" y2="500" />
                </g>

                <!-- Soft floor shadow -->
                <ellipse cx="400" cy="442" rx="142" ry="12" fill="#B5B0A5" opacity="0.65" />

                <!-- Plain Plastic/Kraft Standing Pouch -->
                <path
                  d="M272 68 Q272 56 286 56 L514 56 Q528 56 528 68 L544 416 Q545 438 522 438 L278 438 Q255 438 256 416 Z"
                  fill="url(#beforePouchShade)"
                  stroke="#948F86"
                  stroke-width="2.5"
                />
                <!-- Tear notches & plain zip line -->
                <path d="M271 86 L279 90 L271 94 Z" fill="#DDD9D0" />
                <path d="M529 86 L521 90 L529 94 Z" fill="#DDD9D0" />
                <line x1="270" y1="106" x2="530" y2="106" stroke="#ABA69C" stroke-width="2" stroke-dasharray="6 5" />

                <!-- Generic monochrome sticker (slightly crooked) -->
                <g transform="rotate(-1.2 400 258)">
                  <rect x="296" y="168" width="208" height="176" fill="#FAF8F5" stroke="#99948B" stroke-width="2" />
                  <text x="400" y="203" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#635F59">Kopi Bubuk Asli</text>
                  <text x="400" y="236" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#3F3D39">"{{ displayBrand }}"</text>
                  <line x1="320" y1="252" x2="480" y2="252" stroke="#B5B0A6" stroke-width="1.5" />
                  <text x="400" y="276" text-anchor="middle" font-family="sans-serif" font-size="12.5" fill="#6E6A63">Arabika &amp; Robusta Pilihan</text>
                  <text x="400" y="298" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#8A857C">Wangi, Nikmat, Harga Terjangkau</text>
                  <text x="400" y="324" text-anchor="middle" font-family="monospace" font-size="11" fill="#8A857C">Order WA: 0812-xxxx-xxxx</text>
                </g>

                <!-- Callout notes -->
                <g>
                  <rect x="38" y="140" width="184" height="64" fill="#FAF8F5" stroke="#7A756C" stroke-width="2" />
                  <text x="54" y="166" font-family="monospace" font-size="12" font-weight="700" fill="#57544F">✕ KURANG KONTRAS</text>
                  <text x="54" y="187" font-family="sans-serif" font-size="12" fill="#6E6A63">Sulit dilirik di rak kafe</text>

                  <rect x="578" y="250" width="184" height="64" fill="#FAF8F5" stroke="#7A756C" stroke-width="2" />
                  <text x="594" y="276" font-family="monospace" font-size="12" font-weight="700" fill="#57544F">✕ TANPA HIERARKI</text>
                  <text x="594" y="297" font-family="sans-serif" font-size="12" fill="#6E6A63">Stiker polos &amp; standar</text>
                </g>
              </svg>

              <span class="absolute top-3 right-3 px-3 py-1 bg-[#F4F1EA] text-[#0B0B0F] border-2 border-[#0B0B0F] font-mono text-xs font-bold uppercase shadow-brutal-sm">
                SEBELUM · Kemasan Polos
              </span>
            </div>

            <!-- LAYER 2: AFTER (Clipped by position% — 100% Live-Synced with Brand Kit 3D & HERO) -->
            <div
              class="absolute inset-0 w-full h-full bg-[#F6F3EC] flex items-center justify-center p-4 overflow-hidden"
              :style="{ clipPath: `inset(0 ${100 - position}% 0 0)` }"
            >
              <svg
                viewBox="0 0 800 500"
                class="w-full h-full"
                role="img"
                :aria-label="`Desain kemasan baru ${displayBrand} (${vibe}, ${finish}) hasil rebranding Arc Lab — sinkron langsung dengan Konfigurator Brand Kit 3D`"
              >
                <defs>
                  <!-- Clean soft studio backdrop -->
                  <radialGradient id="afterSyncStudioBg" cx="50%" cy="46%" r="58%">
                    <stop offset="0%" stop-color="#FFFFFF" />
                    <stop offset="70%" stop-color="#F5F2EB" />
                    <stop offset="100%" stop-color="#E7E1D5" />
                  </radialGradient>

                  <!-- Soft realistic floor contact shadow -->
                  <radialGradient id="afterPouchFloorShadow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#0B0B0F" stop-opacity="0.34" />
                    <stop offset="55%" stop-color="#0B0B0F" stop-opacity="0.14" />
                    <stop offset="100%" stop-color="#0B0B0F" stop-opacity="0" />
                  </radialGradient>

                  <!-- Authentic 18:26 commercial stand-up pouch silhouette clip -->
                  <clipPath id="afterPouchClip">
                    <path d="M268 48 Q268 34 282 34 L518 34 Q532 34 532 48 L532 68 L525 72 L532 76 L516 422 Q514 446 400 452 Q286 446 284 422 L268 76 L275 72 L268 68 Z" />
                  </clipPath>

                  <!-- Photorealistic matte foil 3D lighting & volume shading overlay -->
                  <linearGradient id="afterFoilVolume" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#0B0503" stop-opacity="0.38" />
                    <stop offset="8%" stop-color="#0B0503" stop-opacity="0.1" />
                    <stop offset="22%" stop-color="#FFF5E6" stop-opacity="0.18" />
                    <stop offset="38%" stop-color="#FFFFFF" stop-opacity="0.03" />
                    <stop offset="74%" stop-color="#000000" stop-opacity="0.04" />
                    <stop offset="88%" stop-color="#FFF3E0" stop-opacity="0.14" />
                    <stop offset="96%" stop-color="#0B0503" stop-opacity="0.22" />
                    <stop offset="100%" stop-color="#0B0503" stop-opacity="0.42" />
                  </linearGradient>

                  <!-- Subtle corner tension crease speculars -->
                  <radialGradient id="afterFoilHighlightTL" cx="24%" cy="22%" r="36%">
                    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22" />
                    <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
                  </radialGradient>
                  <radialGradient id="afterFoilHighlightTR" cx="80%" cy="24%" r="32%">
                    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.16" />
                    <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
                  </radialGradient>
                  <linearGradient id="afterBottomGussetShade" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#0B0503" stop-opacity="0" />
                    <stop offset="78%" stop-color="#0B0503" stop-opacity="0.06" />
                    <stop offset="100%" stop-color="#0B0503" stop-opacity="0.34" />
                  </linearGradient>
                </defs>

                <!-- Studio Cyclorama Backdrop -->
                <rect width="800" height="500" fill="url(#afterSyncStudioBg)" />
                <g stroke="#0B0B0F" stroke-opacity="0.055" stroke-width="1">
                  <line x1="0" y1="448" x2="800" y2="448" />
                  <line x1="120" y1="0" x2="120" y2="500" />
                  <line x1="680" y1="0" x2="680" y2="500" />
                </g>

                <!-- Soft Studio Floor Contact Shadow -->
                <ellipse cx="400" cy="452" rx="146" ry="18" fill="url(#afterPouchFloorShadow)" />

                <!-- Pouch Base Shape + Live-Synced Canvas Texture from labelCanvas.ts -->
                <g clip-path="url(#afterPouchClip)">
                  <!-- Base fallback fill while canvas renders -->
                  <rect x="266" y="32" width="268" height="422" fill="#35180F" />

                  <!-- Live Synchronized Label Artwork (identical to HERO & Brand Kit 3D) -->
                  <image
                    v-if="afterLabelDataUrl"
                    :href="afterLabelDataUrl"
                    x="266"
                    y="34"
                    width="268"
                    height="418"
                    preserveAspectRatio="xMidYMid slice"
                  />

                  <!-- Kraft tint overlay when Kraft finish is active -->
                  <rect
                    v-if="finish === 'Kraft'"
                    x="266"
                    y="32"
                    width="268"
                    height="422"
                    fill="#C9A878"
                    fill-opacity="0.24"
                    style="mix-blend-mode: multiply"
                  />

                  <!-- Photorealistic 3D Matte Foil Lighting & Volume Shading -->
                  <rect x="266" y="32" width="268" height="422" fill="url(#afterFoilVolume)" />
                  <rect x="266" y="32" width="268" height="422" fill="url(#afterFoilHighlightTL)" />
                  <rect x="266" y="32" width="268" height="422" fill="url(#afterFoilHighlightTR)" />
                  <rect x="266" y="32" width="268" height="422" fill="url(#afterBottomGussetShade)" />

                  <!-- Glossy specular streak when Glossy finish is active -->
                  <polygon
                    v-if="finish === 'Glossy'"
                    points="300,34 348,34 334,452 288,452"
                    fill="#FFFFFF"
                    fill-opacity="0.16"
                  />

                  <!-- Top Heat-Seal & Resealable Dual-Ridge Zipper Detail -->
                  <line x1="268" y1="74" x2="532" y2="74" stroke="#000000" stroke-opacity="0.28" stroke-width="2" />
                  <line x1="268" y1="76.5" x2="532" y2="76.5" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="1.2" />
                  <line x1="268" y1="84" x2="532" y2="84" stroke="#000000" stroke-opacity="0.34" stroke-width="2.2" />
                  <line x1="268" y1="86.5" x2="532" y2="86.5" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1.4" />

                  <!-- Side Heat-Seal Perimeter Flange Lines -->
                  <line x1="281" y1="34" x2="294" y2="448" stroke="#000000" stroke-opacity="0.18" stroke-width="1.5" />
                  <line x1="519" y1="34" x2="506" y2="448" stroke="#000000" stroke-opacity="0.18" stroke-width="1.5" />
                </g>

                <!-- Crisp Pouch Outer Rim Outline -->
                <path
                  d="M268 48 Q268 34 282 34 L518 34 Q532 34 532 48 L532 68 L525 72 L532 76 L516 422 Q514 446 400 452 Q286 446 284 422 L268 76 L275 72 L268 68 Z"
                  fill="none"
                  stroke="#1E0E09"
                  stroke-opacity="0.35"
                  stroke-width="1.5"
                />

                <!-- Neo-Brutalist Positive Callouts -->
                <g>
                  <rect x="44" y="144" width="188" height="66" fill="#0B0B0F" />
                  <rect x="38" y="138" width="188" height="66" fill="#F4F1EA" stroke="#0B0B0F" stroke-width="3" />
                  <text x="54" y="165" font-family="monospace" font-size="12" font-weight="700" fill="#5B5BFF">✓ SINKRON BRAND KIT</text>
                  <text x="54" y="187" font-family="sans-serif" font-size="12.5" font-weight="700" fill="#0B0B0F">{{ vibe }} · {{ finish }}</text>

                  <rect x="578" y="254" width="188" height="66" fill="#0B0B0F" />
                  <rect x="572" y="248" width="188" height="66" fill="#FFD84D" stroke="#0B0B0F" stroke-width="3" />
                  <text x="588" y="275" font-family="monospace" font-size="12" font-weight="700" fill="#0B0B0F">✓ SIAP KAFE &amp; RITEL</text>
                  <text x="588" y="297" font-family="sans-serif" font-size="12.5" font-weight="700" fill="#0B0B0F">Pouch 250g siap cetak</text>
                </g>
              </svg>

              <span class="absolute top-3 left-3 px-3 py-1 bg-yellow text-[#0B0B0F] border-2 border-[#0B0B0F] font-mono text-xs font-bold uppercase shadow-brutal-sm">
                SESUDAH · {{ displayBrand }} ({{ vibe }})
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
