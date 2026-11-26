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
  <section id="transformasi" class="py-20 sm:py-28 lg:py-32 bg-white">
    <div class="swiss-container">
      <!-- Numbered Swiss Section Header -->
      <div v-reveal class="mb-14 sm:mb-16">
        <div class="swiss-section-rule mb-5"></div>
        <div class="swiss-grid gap-y-6 items-end">
          <div class="col-span-4 lg:col-span-2">
            <span class="swiss-mono text-signal">03 / STUDI KASUS</span>
          </div>
          <div class="col-span-4 lg:col-span-6">
            <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[0.98] text-black text-left">
              Sebelum &amp; sesudah rebranding.
            </h2>
          </div>
          <div class="col-span-4 lg:col-span-4">
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed text-left">
              Geser garis pembatas (atau tekan tombol panah kiri dan kanan) untuk membandingkan daya tarik kemasan produk UMKM yang sama di rak ritel.
            </p>
          </div>
        </div>
      </div>

      <!-- 12-Col Layout: 8-Col Sharp Comparison Frame + 4-Col Metrics -->
      <div v-reveal="80" class="swiss-grid gap-y-10 items-start">
        <!-- 8-Col Sharp Frame -->
        <div class="col-span-4 lg:col-span-8 border border-black bg-white rounded-none">
          <!-- Top Mono Status Bar -->
          <div class="px-4 py-2.5 border-b border-line flex items-center justify-between swiss-mono">
            <span class="text-black">SEBELUM / SESUDAH</span>
            <span class="text-dark-gray"> RASIO PRATINJAU {{ Math.round(position) }}% </span>
          </div>

          <div
            ref="trackRef"
            data-cursor-grow
            class="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden select-none touch-pan-y bg-off-white"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <!-- LAYER 1: BEFORE (Base Full Width) -->
            <div class="absolute inset-0 w-full h-full bg-[#E6E6E2] flex items-center justify-center p-4">
              <svg
                viewBox="0 0 800 500"
                class="w-full h-full"
                role="img"
                aria-label="Desain kemasan lama sebelum rebranding: plastik polos dengan stiker seadanya yang kurang terbaca"
              >
                <rect width="800" height="500" fill="#E6E6E2" />
                <line x1="0" y1="412" x2="800" y2="412" stroke="#C8C8C2" stroke-width="1" />

                <!-- Plain Plastic Pouch -->
                <rect x="255" y="62" width="290" height="380" fill="#F0F0EC" stroke="#A6A6A0" stroke-width="1.5" />
                <line x1="255" y1="106" x2="545" y2="106" stroke="#B6B6B0" stroke-width="1" stroke-dasharray="6 6" />

                <!-- Generic Amateur Sticker -->
                <rect x="292" y="168" width="216" height="176" fill="#FAFAF8" stroke="#A8A8A2" stroke-width="1" />
                <text x="400" y="206" text-anchor="middle" font-family="serif" font-size="18" fill="#5A5A56">Keripik Singkong</text>
                <text x="400" y="236" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="#3A3A36">"BU RINI"</text>
                <line x1="316" y1="252" x2="484" y2="252" stroke="#C4C4BE" stroke-width="1" />
                <text x="400" y="278" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#666662">Rasa Balado Pedas Manis</text>
                <text x="400" y="302" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#7A7A76">Enak, Gurih, Renyah Tanpa Pengawet</text>
                <text x="400" y="326" text-anchor="middle" font-family="monospace" font-size="11" fill="#7A7A76">Hub: 0812-xxxx-xxxx</text>

                <!-- Sharp 1px Diagnostic Notes -->
                <g>
                  <rect x="44" y="142" width="178" height="60" fill="#FFFFFF" stroke="#B6B6B0" stroke-width="1" />
                  <text x="60" y="166" font-family="JetBrains Mono, monospace" font-size="10.5" fill="#767672">01 / KURANG KONTRAS</text>
                  <text x="60" y="186" font-family="Space Grotesk, sans-serif" font-size="12.5" fill="#3A3A36">Tenggelam di etalase</text>

                  <rect x="578" y="252" width="180" height="60" fill="#FFFFFF" stroke="#B6B6B0" stroke-width="1" />
                  <text x="594" y="276" font-family="JetBrains Mono, monospace" font-size="10.5" fill="#767672">02 / TANPA HIERARKI</text>
                  <text x="594" y="296" font-family="Space Grotesk, sans-serif" font-size="12.5" fill="#3A3A36">Informasi menumpuk</text>
                </g>
              </svg>

              <span class="absolute top-3 right-3 px-2.5 py-1 bg-white border border-black swiss-mono text-black">
                SEBELUM
              </span>
            </div>

            <!-- LAYER 2: AFTER (Clipped by position%) -->
            <div
              class="absolute inset-0 w-full h-full bg-off-white flex items-center justify-center p-4"
              :style="{ clipPath: `inset(0 ${100 - position}% 0 0)` }"
            >
              <svg
                viewBox="0 0 800 500"
                class="w-full h-full"
                role="img"
                aria-label="Desain kemasan baru hasil rebranding Arc Lab bergaya Swiss Minimal: tipografi tajam, kontras tinggi, dan siap masuk ritel modern"
              >
                <rect width="800" height="500" fill="#F2F2F0" />
                <!-- Architectural 1px Studio Grid Lines -->
                <g stroke="#D9D9D5" stroke-width="1">
                  <line x1="0" y1="412" x2="800" y2="412" />
                  <line x1="200" y1="0" x2="200" y2="500" />
                  <line x1="600" y1="0" x2="600" y2="500" />
                </g>

                <!-- Upgraded Matte Black Standing Pouch -->
                <rect x="255" y="56" width="290" height="386" fill="#0A0A0A" />
                <!-- Signal Red Top Band -->
                <rect x="255" y="56" width="290" height="44" fill="#E63312" />
                <text x="278" y="83" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="500" letter-spacing="1.4" fill="#FFFFFF">
                  NO. 01 / KEMASAN KEDAP UDARA
                </text>

                <!-- Crisp White Swiss Grid Front Label -->
                <rect x="278" y="122" width="244" height="270" fill="#FFFFFF" />
                <line x1="296" y1="162" x2="504" y2="162" stroke="#D9D9D5" stroke-width="1" />
                <line x1="296" y1="336" x2="504" y2="336" stroke="#D9D9D5" stroke-width="1" />

                <text x="296" y="148" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#8A8A86">SINGKONG REMPAH</text>
                <text x="504" y="148" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#E63312">200G</text>

                <!-- Pure Black Arc + Red Dot Mark -->
                <path d="M310 206 A13 13 0 1 1 329 206" fill="none" stroke="#0A0A0A" stroke-width="3" />
                <circle cx="319.5" cy="196.5" r="3.5" fill="#E63312" />

                <!-- Left-Aligned Swiss Grotesk Brand Name -->
                <text x="296" y="254" font-family="Space Grotesk, sans-serif" font-size="34" font-weight="600" letter-spacing="-1.2" fill="#0A0A0A">
                  Kriuk Rini.
                </text>
                <rect x="296" y="274" width="164" height="28" fill="#0A0A0A" />
                <text x="306" y="292" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="500" letter-spacing="1" fill="#FFFFFF">
                  BALADO DAUN JERUK
                </text>

                <text x="296" y="362" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#0A0A0A">HALAL ID · P-IRT RESMI</text>
                <text x="504" y="362" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#8A8A86">BANDUNG</text>

                <!-- Positive Swiss Callouts -->
                <g>
                  <rect x="38" y="140" width="184" height="62" fill="#FFFFFF" stroke="#0A0A0A" stroke-width="1" />
                  <text x="54" y="164" font-family="JetBrains Mono, monospace" font-size="10.5" fill="#E63312">01 / IDENTITAS PRESISI</text>
                  <text x="54" y="185" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="500" fill="#0A0A0A">Kontras kuat di rak</text>

                  <rect x="578" y="250" width="184" height="62" fill="#FFFFFF" stroke="#0A0A0A" stroke-width="1" />
                  <text x="594" y="274" font-family="JetBrains Mono, monospace" font-size="10.5" fill="#E63312">02 / SIAP RITEL MODERN</text>
                  <text x="594" y="295" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="500" fill="#0A0A0A">PIRT &amp; varian terbaca</text>
                </g>
              </svg>

              <span class="absolute top-3 left-3 px-2.5 py-1 bg-black text-white border border-black swiss-mono">
                SESUDAH
              </span>
            </div>

            <!-- 1px Vertical Divider Line + Small Square Handle -->
            <div
              class="absolute inset-y-0 z-20 w-px bg-black pointer-events-none"
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
                class="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-none bg-black hover:bg-signal text-white border border-black flex items-center justify-center font-mono text-xs cursor-ew-resize transition-colors duration-300 ease-out"
                @keydown="onKeyDown"
              >
                ↔
              </button>
            </div>
          </div>
        </div>

        <!-- 4-Col Impact Summary with 1px Rules (No Cards) -->
        <div v-reveal="140" class="col-span-4 lg:col-span-4 border-t border-black pt-6 flex flex-col gap-8">
          <div>
            <span class="swiss-mono text-dark-gray block mb-3">DAMPAK KOMERSIAL</span>
            <h3 class="font-display text-2xl sm:text-3xl font-medium tracking-[-0.025em] leading-tight text-black mb-3 text-left">
              Rasa unggulan butuh kemasan yang meyakinkan pada detik pertama.
            </h3>
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed text-left">
              Tata letak yang bersih menaikkan persepsi harga jual Rp5.000–Rp15.000 per unit tanpa mengubah komposisi produk di dalamnya.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-6 pt-6 border-t border-line">
            <div class="text-left">
              <div class="font-display text-4xl sm:text-5xl font-medium tracking-[-0.035em] leading-none text-signal">
                3,2x
              </div>
              <p class="swiss-mono text-dark-gray mt-3 leading-relaxed">
                RASIO KLIK KATALOG MARKETPLACE
              </p>
            </div>
            <div class="text-left border-l border-line pl-6">
              <div class="font-display text-4xl sm:text-5xl font-medium tracking-[-0.035em] leading-none text-black">
                100%
              </div>
              <p class="swiss-mono text-dark-gray mt-3 leading-relaxed">
                STANDAR TOKO OLEH-OLEH &amp; RITEL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
