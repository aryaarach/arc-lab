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
        paper: '#F4F1EA',
        'paper-dark': '#EAE5D9',
        ink: '#0B0B0F',
        indigo: '#5B5BFF',
        cyan: '#22E6D0',
        coral: '#FF6B4A',
        yellow: '#FFD84D'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        brutal: '6px 6px 0 0 #0B0B0F',
        'brutal-sm': '3px 3px 0 0 #0B0B0F',
        'brutal-lg': '10px 10px 0 0 #0B0B0F',
        'brutal-white': '6px 6px 0 0 #F4F1EA',
        'brutal-cyan': '6px 6px 0 0 #22E6D0',
        'brutal-yellow': '6px 6px 0 0 #FFD84D'
      },
      borderWidth: {
        DEFAULT: '2px',
        2: '2px',
        3: '3px'
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        stamp: {
          '0%': { transform: 'scale(2.4) rotate(-18deg)', opacity: '0' },
          '65%': { transform: 'scale(0.92) rotate(-7deg)', opacity: '1' },
          '82%': { transform: 'scale(1.06) rotate(-5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-6deg)', opacity: '1' }
        }
      },
      animation: {
        marquee: 'marquee 26s linear infinite',
        stamp: 'stamp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards'
      }
    }
  }
}
