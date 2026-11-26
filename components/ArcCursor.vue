<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const enabled = ref(false)
const visible = ref(false)
const hoveredInteractive = ref(false)
const pressed = ref(false)
const ringEl = ref<HTMLElement | null>(null)

let rafId = 0
let targetX = -100
let targetY = -100
let currentX = -100
let currentY = -100

const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, summary, label, [role="button"], [role="slider"], [tabindex]:not([tabindex="-1"]), [data-cursor-grow]'

onMounted(() => {
  if (typeof window === 'undefined') return
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!finePointer || reducedMotion) return

  enabled.value = true

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      visible.value = false
      return
    }
    targetX = e.clientX
    targetY = e.clientY
    if (!visible.value) {
      currentX = targetX
      currentY = targetY
      visible.value = true
    }
  }

  const onPointerOver = (e: PointerEvent) => {
    const target = e.target as Element | null
    hoveredInteractive.value = !!target?.closest(INTERACTIVE_SELECTOR)
  }

  const onPointerDown = () => {
    pressed.value = true
  }

  const onPointerUp = () => {
    pressed.value = false
  }

  const onMouseLeaveWindow = () => {
    visible.value = false
  }

  const tick = () => {
    currentX += (targetX - currentX) * 0.26
    currentY += (targetY - currentY) * 0.26
    if (ringEl.value) {
      ringEl.value.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
    }
    rafId = window.requestAnimationFrame(tick)
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('pointerover', onPointerOver, { passive: true })
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  document.addEventListener('mouseleave', onMouseLeaveWindow)
  rafId = window.requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    window.cancelAnimationFrame(rafId)
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerover', onPointerOver)
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('mouseleave', onMouseLeaveWindow)
  })
})
</script>

<template>
  <div
    v-if="enabled"
    ref="ringEl"
    aria-hidden="true"
    class="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference transition-opacity duration-300 ease-out"
    :class="visible ? 'opacity-100' : 'opacity-0'"
  >
    <div
      class="-translate-x-1/2 -translate-y-1/2 rounded-full border border-white transition-all duration-300 ease-out"
      :class="[
        hoveredInteractive ? 'w-12 h-12' : 'w-7 h-7',
        pressed ? 'scale-90' : 'scale-100'
      ]"
    ></div>
  </div>
</template>
