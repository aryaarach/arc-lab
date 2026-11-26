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
        white: '#FFFFFF',
        'off-white': '#F2F2F0',
        surface: '#F2F2F0',
        black: '#0A0A0A',
        ink: '#0A0A0A',
        'mid-gray': '#8A8A86',
        'dark-gray': '#595955',
        line: '#D9D9D5',
        signal: '#E63312'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      maxWidth: {
        swiss: '1440px'
      },
      transitionTimingFunction: {
        swiss: 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        fadeInSubtle: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        marquee: 'marquee 48s linear infinite',
        'fade-in': 'fadeInSubtle 0.35s ease-out forwards'
      }
    }
  }
}
