<script setup lang="ts">
import { computed } from 'vue'

const config = useAppConfig()

const siteTitle = 'Arc Lab — Studio Desain Logo, Kemasan 3D & Branding UMKM Indonesia'
const siteDesc =
  'Studio desain grafis spesialis UMKM Indonesia: logo orisinal, kemasan siap cetak + mockup 3D, banner toko, dan feed Instagram. Selesai 2–4 hari kerja, mulai Rp99.000.'

useHead({
  title: siteTitle,
  meta: [
    { name: 'description', content: siteDesc },
    { name: 'theme-color', content: '#F4F1EA' },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'id_ID' },
    { property: 'og:site_name', content: 'Arc Lab' },
    { property: 'og:title', content: siteTitle },
    { property: 'og:description', content: siteDesc },
    { property: 'og:image', content: '/og-cover.svg' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: siteTitle },
    { name: 'twitter:description', content: siteDesc },
    { name: 'twitter:image', content: '/og-cover.svg' }
  ]
})

const heroWaUrl = computed(() => {
  const msg = encodeURIComponent('Halo Arc Lab! Saya tertarik konsultasi konsep desain gratis untuk brand UMKM saya.')
  return `https://wa.me/${config.whatsappNumber}?text=${msg}`
})
</script>

<template>
  <div class="min-h-screen bg-paper text-ink selection:bg-yellow selection:text-ink">
    <!-- Accessible Skip Link -->
    <a
      href="#konten-utama"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-yellow focus:border-2 focus:border-ink focus:font-mono focus:text-xs focus:font-bold"
    >
      Lewati ke konten utama
    </a>

    <!-- Custom Desktop Ring Cursor -->
    <ClientOnly>
      <ArcCursor />
    </ClientOnly>

    <!-- Sticky Neo-Brutalist Navigation -->
    <NavBar />

    <main id="konten-utama">
      <!-- HERO SECTION -->
      <section id="beranda" class="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-lab-grid">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <!-- Left Copy Column (6 cols) -->
          <div class="lg:col-span-6 flex flex-col items-start">
            <div class="brutal-tag bg-yellow text-ink mb-5">
              <span class="w-2 h-2 rounded-full bg-coral" aria-hidden="true"></span>
              <span>LABORATORIUM VISUAL UMKM INDONESIA</span>
            </div>

            <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.06]">
              Bikin brand lokalmu tampil
              <span class="inline-block px-2.5 bg-cyan border-2 border-ink shadow-brutal-sm mt-1">
                naik kelas
              </span>
              tanpa ribet.
            </h1>

            <p class="mt-6 text-base sm:text-lg text-ink/85 max-w-xl leading-relaxed">
              Logo ikonik, kemasan siap cetak dengan pratinjau 3D, banner toko, hingga feed Instagram seragam — beres dalam <strong>2–4 hari kerja</strong> dengan harga ramah UMKM.
            </p>

            <!-- Hero CTAs -->
            <div class="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <a
                :href="heroWaUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="brutal-btn bg-indigo text-paper px-7 py-4 text-base"
              >
                <span>Konsultasi Konsep Gratis</span>
                <span aria-hidden="true">→</span>
              </a>
              <a
                href="#mixer"
                class="brutal-btn bg-paper hover:bg-yellow text-ink px-6 py-4 text-base"
              >
                Coba 3D Kemasan Mixer
              </a>
            </div>

            <!-- Trust Metrics Strip -->
            <div class="mt-10 pt-6 border-t-2 border-ink grid grid-cols-3 gap-4 w-full max-w-lg">
              <div>
                <div class="font-display text-2xl sm:text-3xl font-bold">150+</div>
                <div class="font-mono text-[11px] uppercase text-ink/75 mt-0.5">UMKM Terbantu</div>
              </div>
              <div>
                <div class="font-display text-2xl sm:text-3xl font-bold text-indigo">2–4 Hari</div>
                <div class="font-mono text-[11px] uppercase text-ink/75 mt-0.5">Rata-Rata Selesai</div>
              </div>
              <div>
                <div class="font-display text-2xl sm:text-3xl font-bold">Rp99rb</div>
                <div class="font-mono text-[11px] uppercase text-ink/75 mt-0.5">Harga Mulai</div>
              </div>
            </div>
          </div>

          <!-- Right Interactive 3D Hero Scene Column (6 cols) -->
          <div class="lg:col-span-6">
            <ClientOnly>
              <HeroScene />
              <template #fallback>
                <div class="relative w-full h-[360px] sm:h-[430px] lg:h-[500px] border-2 border-ink bg-paper shadow-brutal-lg overflow-hidden">
                  <div class="h-9 px-3 bg-ink text-paper flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
                    <span>ARC-REACTOR // MEMUAT STUDIO 3D</span>
                    <span class="text-yellow">SIAP</span>
                  </div>
                  <div class="w-full h-[calc(100%-2.25rem)] flex items-center justify-center bg-lab-grid p-4">
                    <img
                      src="/hero-fallback.svg"
                      alt="Ilustrasi laboratorium desain geometris Arc Lab"
                      width="640"
                      height="520"
                      class="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </template>
            </ClientOnly>
          </div>
        </div>
      </section>

      <!-- Infinite Ticker Strip -->
      <MarqueeStrip />

      <!-- Services Bento Grid -->
      <ServiceBento />

      <!-- Interactive 3D Packaging Brand Mixer -->
      <ClientOnly>
        <BrandMixer />
        <template #fallback>
          <section id="mixer" class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper-dark/60">
            <div class="max-w-7xl mx-auto">
              <div class="brutal-card p-8 text-center font-mono text-sm">
                Memuat Studio 3D Brand &amp; Kemasan Mixer...
              </div>
            </div>
          </section>
        </template>
      </ClientOnly>

      <!-- Draggable Before / After Packaging Comparison -->
      <BeforeAfter />

      <!-- Scroll-Following Process Timeline -->
      <ProcessTimeline />

      <!-- Interactive Price Calculator with Eased Count Tween & Bundle Stamp -->
      <PriceCalc />

      <!-- UMKM Client Testimonials -->
      <Testimonials />

      <!-- Accessible FAQ Accordion -->
      <FaqAccordion />
    </main>

    <!-- Final CTA + Studio Footer -->
    <CtaFooter />
  </div>
</template>
