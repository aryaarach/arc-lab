<script setup lang="ts">
const siteTitle = 'Arc Lab — Studio Desain Logo, Kemasan & Konten Sosmed untuk UMKM'
const siteDesc =
  'Studio desain grafis bergaya Swiss Minimal untuk UMKM Indonesia: logo, kemasan produk siap cetak + pratinjau 3D, banner, dan konten sosmed presisi.'

useHead({
  title: siteTitle,
  meta: [
    { name: 'description', content: siteDesc },
    { name: 'theme-color', content: '#FFFFFF' },
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
  <div class="min-h-screen bg-white text-black selection:bg-signal selection:text-white">
    <!-- Accessible Skip Link -->
    <a
      href="#konten-utama"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-6 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-black focus:text-white focus:border focus:border-black focus:font-mono focus:text-xs focus:uppercase focus:tracking-wider"
    >
      Lewati ke konten utama
    </a>

    <!-- Custom Desktop 1px Difference Ring Cursor (Hidden on touch devices) -->
    <ClientOnly>
      <ArcCursor />
    </ClientOnly>

    <!-- Full-Width Swiss Grid Navigation -->
    <NavBar />

    <main id="konten-utama">
      <!-- Swiss Minimal Typographic Hero + 3D Product Showcase -->
      <HeroScene />

      <!-- Inverted Black Grotesk Marquee Strip -->
      <MarqueeStrip />

      <!-- Strict Modular Services Grid with 1px Dividers -->
      <ServiceBento />

      <!-- Interactive 3D Packaging Brand Mixer -->
      <BrandMixer />

      <!-- Sharp-Framed Before / After Packaging Comparison -->
      <BeforeAfter />

      <!-- 4-Column Horizontal Process Timeline with Red Dot Progress -->
      <ProcessTimeline />

      <!-- Tabular Price Calculator (#harga) with Eased Tween & Bundle State -->
      <PriceCalc />

      <!-- Large Left-Aligned Single Quote Carousel -->
      <Testimonials />

      <!-- 1px Rule Indexed FAQ Accordion -->
      <FaqAccordion />
    </main>

    <!-- Inverted Black CTA + 12-Col Studio Footer -->
    <CtaFooter />
  </div>
</template>
