<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Point {
  x: number
  y: number
}

interface FlightRoute {
  p0: Point
  p1: Point
  p2: Point
  p3: Point
  durationMs: number
}

// Normalized viewport routes (0..1); starts and ends cleanly off-screen
const ROUTES: FlightRoute[] = [
  {
    p0: { x: -0.1, y: 0.34 },
    p1: { x: 0.28, y: 0.12 },
    p2: { x: 0.68, y: 0.44 },
    p3: { x: 1.12, y: 0.18 },
    durationMs: 9500
  },
  {
    p0: { x: 1.12, y: 0.26 },
    p1: { x: 0.72, y: 0.52 },
    p2: { x: 0.34, y: 0.16 },
    p3: { x: -0.1, y: 0.46 },
    durationMs: 10500
  },
  {
    p0: { x: -0.1, y: 0.68 },
    p1: { x: 0.32, y: 0.42 },
    p2: { x: 0.64, y: 0.76 },
    p3: { x: 1.12, y: 0.32 },
    durationMs: 10000
  },
  {
    p0: { x: 1.12, y: 0.62 },
    p1: { x: 0.68, y: 0.24 },
    p2: { x: 0.3, y: 0.68 },
    p3: { x: -0.1, y: 0.22 },
    durationMs: 9800
  }
]

const PAUSE_BETWEEN_FLIGHTS_MS = 2800
const INITIAL_DELAY_MS = 350
const MAX_TRAIL_POINTS = 34
const TRAIL_SAMPLE_DIST_SQ = 144 // 12px squared

const enabled = ref(false)
const viewportW = ref(1440)
const viewportH = ref(900)
const planeEl = ref<SVGGElement | null>(null)
const trailPathEl = ref<SVGPathElement | null>(null)

let rafId = 0
let routeIndex = 0
let phase: 'delay' | 'flying' | 'pause' = 'delay'
let phaseElapsed = 0
let lastTimestamp = 0
let trail: Point[] = []

function evalBezier(t: number, r: FlightRoute, w: number, h: number) {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t

  const x =
    (uuu * r.p0.x + 3 * uu * t * r.p1.x + 3 * u * tt * r.p2.x + ttt * r.p3.x) * w
  const y =
    (uuu * r.p0.y + 3 * uu * t * r.p1.y + 3 * u * tt * r.p2.y + ttt * r.p3.y) * h

  // First derivative for heading angle
  const dx =
    (3 * uu * (r.p1.x - r.p0.x) +
      6 * u * t * (r.p2.x - r.p1.x) +
      3 * tt * (r.p3.x - r.p2.x)) *
    w
  const dy =
    (3 * uu * (r.p1.y - r.p0.y) +
      6 * u * t * (r.p2.y - r.p1.y) +
      3 * tt * (r.p3.y - r.p2.y)) *
    h

  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI }
}

function buildTrailPath(points: Point[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`
  }
  return d
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) return

  viewportW.value = window.innerWidth
  viewportH.value = window.innerHeight
  enabled.value = true

  const onResize = () => {
    viewportW.value = window.innerWidth
    viewportH.value = window.innerHeight
  }

  const onVisibilityChange = () => {
    if (!document.hidden) {
      lastTimestamp = 0
    }
  }

  const tick = (now: number) => {
    if (document.hidden) {
      lastTimestamp = 0
      rafId = window.requestAnimationFrame(tick)
      return
    }

    if (!lastTimestamp) lastTimestamp = now
    const dt = Math.min(now - lastTimestamp, 64)
    lastTimestamp = now
    phaseElapsed += dt

    if (phase === 'delay') {
      if (phaseElapsed >= INITIAL_DELAY_MS) {
        phase = 'flying'
        phaseElapsed = 0
        trail = []
      }
    } else if (phase === 'flying') {
      const route = ROUTES[routeIndex]
      const rawT = Math.min(phaseElapsed / route.durationMs, 1)
      // Gentle ease-in-out so entry and exit feel organic
      const t = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2

      const { x, y, angle } = evalBezier(t, route, viewportW.value, viewportH.value)
      // Subtle aerodynamic bobbing perpendicular to flight
      const bobY = Math.sin(phaseElapsed * 0.0065) * 3.5

      if (planeEl.value) {
        // Flip vertically when flying right-to-left so the cabin/tail stays upright
        const isGoingLeft = Math.abs(angle) > 90
        const flipScaleY = isGoingLeft ? -1 : 1
        planeEl.value.setAttribute(
          'transform',
          `translate(${x.toFixed(1)}, ${(y + bobY).toFixed(1)}) rotate(${angle.toFixed(1)}) scale(1, ${flipScaleY})`
        )
        planeEl.value.style.opacity = '1'
      }

      const last = trail[trail.length - 1]
      const curY = y + bobY
      if (!last || (x - last.x) ** 2 + (curY - last.y) ** 2 >= TRAIL_SAMPLE_DIST_SQ) {
        trail.push({ x, y: curY })
        if (trail.length > MAX_TRAIL_POINTS) {
          trail.shift()
        }
        if (trailPathEl.value) {
          trailPathEl.value.setAttribute('d', buildTrailPath(trail))
          // Fade trail gently near the end of the pass
          const fadeOut = rawT > 0.85 ? Math.max(0, (1 - rawT) / 0.15) : 1
          trailPathEl.value.style.opacity = (0.55 * fadeOut).toFixed(2)
        }
      }

      if (rawT >= 1) {
        phase = 'pause'
        phaseElapsed = 0
        routeIndex = (routeIndex + 1) % ROUTES.length
        if (planeEl.value) planeEl.value.style.opacity = '0'
        if (trailPathEl.value) {
          trailPathEl.value.setAttribute('d', '')
          trailPathEl.value.style.opacity = '0'
        }
      }
    } else if (phase === 'pause') {
      if (phaseElapsed >= PAUSE_BETWEEN_FLIGHTS_MS) {
        phase = 'flying'
        phaseElapsed = 0
        trail = []
      }
    }

    rafId = window.requestAnimationFrame(tick)
  }

  window.addEventListener('resize', onResize, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  rafId = window.requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    window.cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
})
</script>

<template>
  <div
    v-if="enabled"
    aria-hidden="true"
    class="fixed inset-0 z-40 pointer-events-none overflow-hidden select-none"
  >
    <svg
      class="w-full h-full"
      :viewBox="`0 0 ${viewportW} ${viewportH}`"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Dashed Neo-Brutalist Contrail -->
      <path
        ref="trailPathEl"
        d=""
        stroke="#0B0B0F"
        stroke-width="2"
        stroke-dasharray="7 7"
        stroke-linecap="round"
        style="opacity: 0"
      />

      <!-- Stylized Neo-Brutalist Airplane (oriented right at 0deg, centered at 0,0) -->
      <g ref="planeEl" style="opacity: 0">
        <!-- Hard Neo-Brutalist Drop Shadow -->
        <g transform="translate(3, 4)" opacity="0.22">
          <path
            d="M 28 0 C 28 -4.5 21 -7 12 -7 L -16 -7 L -24 -15 L -28 -15 L -24 -4 L -27 -2 L -27 2 L -24 4 L -20 6 L 12 6 C 21 6 28 4 28 0 Z"
            fill="#0B0B0F"
          />
          <path d="M 4 -4 L -8 -20 L -14 -20 L -6 -4 Z" fill="#0B0B0F" />
          <path d="M 5 3 L -6 17 L -13 17 L -4 3 Z" fill="#0B0B0F" />
        </g>

        <!-- Back / Upper Wing -->
        <path
          d="M 3 -4 L -8 -19 L -14 -19 L -6 -4 Z"
          fill="#FFD84D"
          stroke="#0B0B0F"
          stroke-width="2.2"
          stroke-linejoin="round"
        />

        <!-- Vertical Tail Fin -->
        <path
          d="M -15 -5 L -23 -16 L -28 -16 L -23 -4 Z"
          fill="#FF6B4A"
          stroke="#0B0B0F"
          stroke-width="2.2"
          stroke-linejoin="round"
        />

        <!-- Main Fuselage -->
        <path
          d="M 28 0 C 28 -4.5 21 -6.5 12 -6.5 L -22 -5.5 L -27 -2 L -27 2 L -22 5 L 12 5.5 C 21 5.5 28 3.8 28 0 Z"
          fill="#F4F1EA"
          stroke="#0B0B0F"
          stroke-width="2.2"
          stroke-linejoin="round"
        />

        <!-- Accent Racing Stripe -->
        <path
          d="M -21 0.5 L 14 0.5"
          stroke="#5B5BFF"
          stroke-width="2"
          stroke-linecap="round"
        />

        <!-- Cockpit Window -->
        <path
          d="M 14 -4.8 L 21.5 -3.6 C 23.2 -3.3 24.5 -2 24.8 -0.8 L 14 -0.8 Z"
          fill="#22E6D0"
          stroke="#0B0B0F"
          stroke-width="1.8"
          stroke-linejoin="round"
        />

        <!-- Cabin Windows -->
        <circle cx="7" cy="-2.2" r="1.4" fill="#0B0B0F" />
        <circle cx="2" cy="-2.2" r="1.4" fill="#0B0B0F" />
        <circle cx="-3" cy="-2.2" r="1.4" fill="#0B0B0F" />
        <circle cx="-8" cy="-2.2" r="1.4" fill="#0B0B0F" />

        <!-- Front / Lower Wing -->
        <path
          d="M 6 2 L -6 17 L -13 17 L -4 2 Z"
          fill="#FFD84D"
          stroke="#0B0B0F"
          stroke-width="2.2"
          stroke-linejoin="round"
        />

        <!-- Jet Exhaust Spark -->
        <path
          d="M -31 0 L -36 0"
          stroke="#FF6B4A"
          stroke-width="2.2"
          stroke-linecap="round"
        />
      </g>
    </svg>
  </div>
</template>
