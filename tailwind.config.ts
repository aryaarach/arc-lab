import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        sand: '#EFE8DC',
        espresso: '#1F1A17',
        terracotta: {
          DEFAULT: '#C8553D',
          deep: '#A93F29',
          soft: '#F3DFDA'
        },
        sage: {
          DEFAULT: '#8FA48A',
          deep: '#475A43',
          soft: '#E3EAE1'
        },
        butter: {
          DEFAULT: '#F2D98D',
          soft: '#F8EDD0'
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        card: '24px',
        stage: '28px'
      },
      boxShadow: {
        editorial: '0 20px 50px -20px rgba(31, 26, 23, 0.25)',
        'editorial-sm': '0 10px 28px -14px rgba(31, 26, 23, 0.20)',
        'editorial-lg': '0 28px 64px -22px rgba(31, 26, 23, 0.30)'
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        ribbonUnfurl: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-8px) scale(0.94)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        }
      },
      animation: {
        marquee: 'marquee 44s linear infinite',
        ribbon: 'ribbonUnfurl 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards'
      }
    }
  }
}
