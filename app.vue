<script setup lang="ts">
const siteTitle = 'Arc Lab — Studio Desain Logo, Kemasan & Konten Sosmed untuk UMKM'
const siteDesc =
  'Studio desain grafis untuk UMKM Indonesia: logo, kemasan produk siap cetak + pratinjau 3D, banner, dan konten sosmed rapi dengan harga UMKM.'

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

    <!-- Custom Desktop Ring Cursor (Hidden on touch devices) -->
    <ClientOnly>
      <ArcCursor />
    </ClientOnly>

    <!-- Sticky Neo-Brutalist Navigation -->
    <NavBar />

    <main id="konten-utama">
      <!-- Redesigned "Meja Kerja Lab" Hero (SSR copy + fallback SVG, <ClientOnly> Three.js desk scene) -->
      <HeroScene />

      <!-- Infinite Ticker Strip -->
      <MarqueeStrip />

      <!-- Services Bento Grid -->
      <ServiceBento />

      <!-- Interactive 3D Packaging Brand Mixer -->
      <BrandMixer />

      <!-- Draggable Before / After Packaging Comparison -->
      <BeforeAfter />

      <!-- Scroll-Following Process Timeline -->
      <ProcessTimeline />

      <!-- Interactive Price Calculator (#harga) with Eased Tween & Bundle Stamp -->
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
