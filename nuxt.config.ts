export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: ['@nuxtjs/tailwindcss', '@nuxt/fonts'],
  css: ['~/assets/css/tailwind.css'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts'
  },
  fonts: {
    defaults: {
      weights: ['400 700'],
      styles: ['normal', 'italic']
    },
    families: [
      {
        name: 'Fraunces',
        provider: 'google',
        weights: ['300 700'],
        styles: ['normal', 'italic'],
        display: 'swap'
      },
      {
        name: 'Inter',
        provider: 'google',
        weights: ['400 700'],
        styles: ['normal'],
        display: 'swap'
      }
    ]
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'id'
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})
