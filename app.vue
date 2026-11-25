<script setup lang="ts">
const siteTitle = 'Arc Lab — Studio Desain Logo, Kemasan & Konten Sosmed untuk UMKM'
const siteDesc =
  'Studio desain grafis bergaya editorial hangat untuk UMKM Indonesia: logo, kemasan produk siap cetak + pratinjau 3D, banner, dan konten sosmed rapi.'

useHead({
  title: siteTitle,
  meta: [
    { name: 'description', content: siteDesc },
    { name: 'theme-color', content: '#FAF7F2' },
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
  <div class="min-h-screen bg-cream text-espresso selection:bg-butter selection:text-espresso">
    <!-- Accessible Skip Link -->
    <a
      href="#konten-utama"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-5 focus:py-2.5 focus:rounded-full focus:bg-espresso focus:text-cream focus:text-xs focus:font-medium focus:shadow-editorial"
    >
      Lewati ke konten utama
    </a>

    <!-- Custom Desktop Terracotta Ring Cursor (Hidden on touch devices) -->
    <ClientOnly>
      <ArcCursor />
    </ClientOnly>

    <!-- Floating Pill Navigation -->
    <NavBar />

    <main id="konten-utama">
      <!-- Editorial Hero Stage + 3D Product Showcase -->
      <HeroScene />

      <!-- Serif Italic Marquee Strip -->
      <MarqueeStrip />

      <!-- Asymmetric Services Bento Grid -->
      <ServiceBento />

      <!-- Interactive 3D Packaging Brand Mixer -->
      <BrandMixer />

      <!-- Draggable Before / After Packaging Comparison -->
      <BeforeAfter />

      <!-- Editorial Process Timeline -->
      <ProcessTimeline />

      <!-- Interactive Price Calculator (#harga) with Eased Tween & Bundle Ribbon -->
      <PriceCalc />

      <!-- Featured Serif Quote Carousel -->
      <Testimonials />

      <!-- Hairline FAQ Accordion -->
      <FaqAccordion />
    </main>

    <!-- Dark Espresso CTA + Studio Footer -->
    <CtaFooter />
  </div>
</template>
