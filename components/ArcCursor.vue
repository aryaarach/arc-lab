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
    currentX += (targetX - currentX) * 0.2
    currentY += (targetY - currentY) * 0.2
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
    class="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-multiply transition-opacity duration-300 ease-editorial"
    :class="visible ? 'opacity-100' : 'opacity-0'"
  >
    <div
      class="-translate-x-1/2 -translate-y-1/2 rounded-full border border-terracotta/75 flex items-center justify-center transition-all duration-500 ease-editorial"
      :class="[
        hoveredInteractive
          ? 'w-14 h-14 bg-terracotta/20 border-terracotta scale-105'
          : 'w-8 h-8 bg-terracotta/5',
        pressed ? 'scale-90 bg-terracotta/30' : ''
      ]"
    >
      <span
        class="rounded-full bg-terracotta transition-all duration-300 ease-editorial"
        :class="hoveredInteractive ? 'w-1.5 h-1.5 opacity-90' : 'w-1 h-1 opacity-75'"
      ></span>
    </div>
  </div>
</template>
