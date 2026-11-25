<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  useBrandState,
  PRODUCT_CATALOG,
  BRAND_SWATCHES,
  BACKDROP_PRESETS,
  type ProductId,
  type LabelLayout
} from '~/composables/useBrandState'
import { drawLabel } from '~/utils/labelCanvas'
import { buildProductMockup, type MockupBuildResult } from '~/utils/mockups'
import {
  setupStudioStage,
  createContactBlobMesh,
  createCanvasLabelTexture,
  disposeObjectTree,
  captureStagePng
} from '~/utils/threeStage'

const {
  brandName,
  vibe,
  colorHex,
  finish,
  productId,
  backdropId,
  setBrandName,
  cycleBrandColor
} = useBrandState()

const stageWrapRef = ref<HTMLElement | null>(null)
const canvasMountRef = ref<HTMLElement | null>(null)

const staticFallback = ref(false)
const sceneReady = ref(false)
const isHoveringProduct = ref(false)
const isDraggingTurntable = ref(false)
const cameraFlashActive = ref(false)
const stageParallaxY = ref(0)

const hoveredCaption = reactive({
  visible: false,
  text: '',
  x: 0,
  y: 0
})

// Quick keyboard-accessible product tabs shown along bottom studio bar
const heroTabProducts = PRODUCT_CATALOG.slice(0, 6)

const displayBrand = computed(() => (brandName.value.trim() || 'KOPI SENJA').slice(0, 18).toUpperCase())

const currentBackdropMeta = computed(
  () => BACKDROP_PRESETS.find((b) => b.id === backdropId.value) || BACKDROP_PRESETS[0]
)

const dynamicAriaLabel = computed(() => {
  const centerMeta = PRODUCT_CATALOG.find((p) => p.id === productId.value) || PRODUCT_CATALOG[0]
  return `Studio foto 3D menampilkan ${centerMeta.name}, Cup Minuman, Botol Kaca, Kartu Nama, dan Sticker Sheet dengan merek ${displayBrand.value}`
})

function isLightSwatch(hex: string): boolean {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.56
}

let cleanupFn: (() => void) | null = null
let triggerPhotoFn: (() => Promise<void>) | null = null
let focus3DStageFn: (() => void) | null = null
let pauseShowreelFn: (() => void) | null = null

function onBrandInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  setBrandName(val)
  pauseShowreelFn?.()
}

function handleLihat3D() {
  pauseShowreelFn?.()
  focus3DStageFn?.()
  if (stageWrapRef.value) {
    stageWrapRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function selectHeroProduct(id: ProductId) {
  pauseShowreelFn?.()
  productId.value = id
}

function handleCycleColor() {
  pauseShowreelFn?.()
  cycleBrandColor()
}

async function handleTakePhoto() {
  pauseShowreelFn?.()
  cameraFlashActive.value = true
  setTimeout(() => {
    cameraFlashActive.value = false
  }, 320)
  await triggerPhotoFn?.()
}

function isWebGLSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

onMounted(async () => {
  if (typeof window === 'undefined') return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Subtle vertical card parallax on scroll (disabled for reduced motion)
  const onWindowScrollParallax = () => {
    if (prefersReducedMotion || !stageWrapRef.value) return
    const rect = stageWrapRef.value.getBoundingClientRect()
    const centerDelta = (rect.top + rect.height * 0.5 - window.innerHeight * 0.5) / window.innerHeight
    stageParallaxY.value = Math.max(-18, Math.min(18, centerDelta * -22))
  }

  if (!prefersReducedMotion) {
    window.addEventListener('scroll', onWindowScrollParallax, { passive: true })
    onWindowScrollParallax()
  }

  if (prefersReducedMotion || !isWebGLSupported()) {
    staticFallback.value = true
    cleanupFn = () => {
      window.removeEventListener('scroll', onWindowScrollParallax)
    }
    return
  }

  let THREE: typeof import('three')
  let RoomEnvMod: typeof import('three/addons/environments/RoomEnvironment.js')

  try {
    ;[THREE, RoomEnvMod] = await Promise.all([
      import('three'),
      import('three/addons/environments/RoomEnvironment.js'),
      nextTick()
    ])
  } catch {
    staticFallback.value = true
    cleanupFn = () => {
      window.removeEventListener('scroll', onWindowScrollParallax)
    }
    return
  }

  const stageEl = stageWrapRef.value
  const mountEl = canvasMountRef.value
  if (!stageEl || !mountEl) {
    window.removeEventListener('scroll', onWindowScrollParallax)
    return
  }

  let stage: ReturnType<typeof setupStudioStage>
  try {
    stage = setupStudioStage(THREE, RoomEnvMod.RoomEnvironment, mountEl, currentBackdropMeta.value.hex, 29)
  } catch {
    staticFallback.value = true
    cleanupFn = () => {
      window.removeEventListener('scroll', onWindowScrollParallax)
    }
    return
  }

  const { renderer, scene, camera, blobTexture, quality } = stage
  const canvas = renderer.domElement
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', dynamicAriaLabel.value)
  canvas.style.touchAction = 'pan-y'

  // Slight low-angle longer-lens studio hero framing
  const lookTarget = new THREE.Vector3(0, 0.72, 0.15)
  const baseCamDist = 6.15
  const baseCamElev = 0.21
  camera.position.set(
    0,
    lookTarget.y + Math.sin(baseCamElev) * baseCamDist,
    lookTarget.z + Math.cos(baseCamElev) * baseCamDist
  )
  camera.lookAt(lookTarget)

  // Studio turntable holding the 5 hero products
  const turntable = new THREE.Group()
  scene.add(turntable)

  // Shared per-layout CanvasTextures so typing ONLY redraws 2D canvases
  const sharedTextures = {} as Record<LabelLayout, import('three').CanvasTexture>
  const layouts: LabelLayout[] = ['front', 'wrap', 'card', 'sticker']

  const renderAllLabelTextures = async () => {
    const b = displayBrand.value
    const v = vibe.value
    const c = colorHex.value
    const scale = quality.isLowEnd ? 0.75 : 1
    await Promise.all(
      layouts.map(async (ly) => {
        const cv = await drawLabel(b, v, c, ly, scale)
        if (sharedTextures[ly]) {
          sharedTextures[ly].image = cv
          sharedTextures[ly].needsUpdate = true
        } else {
          const tex = createCanvasLabelTexture(THREE, renderer, cv)
          tex.userData.sharedResource = true
          sharedTextures[ly] = tex
        }
      })
    )
  }

  await renderAllLabelTextures()

  interface HeroSlot {
    key: 'center' | 'left' | 'right' | 'frontLeft' | 'frontRight'
    productId: ProductId
    anchor: import('three').Group
    itemHolder: import('three').Group
    blob: import('three').Mesh
    built: MockupBuildResult | null
    basePos: [number, number, number]
    baseRotY: number
    baseScale: number
    hoverLift: number
    hoverScale: number
    bounceTime: number
    swapAnimTime: number
  }

  const slotConfigs: {
    key: HeroSlot['key']
    pos: [number, number, number]
    rotY: number
    scale: number
    blobR: [number, number]
  }[] = [
    { key: 'center', pos: [0, 0, 0.05], rotY: 0.06, scale: 1.08, blobR: [0.76, 0.52] },
    { key: 'left', pos: [-1.32, 0, -0.34], rotY: 0.34, scale: 0.94, blobR: [0.58, 0.48] },
    { key: 'right', pos: [1.34, 0, -0.3], rotY: -0.32, scale: 0.96, blobR: [0.54, 0.48] },
    { key: 'frontLeft', pos: [-0.82, 0, 1.18], rotY: 0.22, scale: 0.76, blobR: [0.62, 0.56] },
    { key: 'frontRight', pos: [0.84, 0, 1.22], rotY: -0.24, scale: 0.82, blobR: [0.58, 0.42] }
  ]

  const slots: HeroSlot[] = slotConfigs.map((cfg) => {
    const anchor = new THREE.Group()
    anchor.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2])
    anchor.rotation.y = cfg.rotY

    const blob = createContactBlobMesh(THREE, blobTexture, cfg.blobR[0], cfg.blobR[1], 0.35)
    anchor.add(blob)

    const itemHolder = new THREE.Group()
    itemHolder.scale.setScalar(cfg.scale)
    anchor.add(itemHolder)
    turntable.add(anchor)

    return {
      key: cfg.key,
      productId: 'pouch',
      anchor,
      itemHolder,
      blob,
      built: null,
      basePos: cfg.pos,
      baseRotY: cfg.rotY,
      baseScale: cfg.scale,
      hoverLift: 0,
      hoverScale: 1,
      bounceTime: -1,
      swapAnimTime: -1
    }
  })

  function computeSlotProductIds(centerId: ProductId): Record<HeroSlot['key'], ProductId> {
    return {
      center: centerId,
      left: centerId === 'cup' ? 'pouch' : 'cup',
      right: centerId === 'bottle' ? 'tote' : 'bottle',
      frontLeft: centerId === 'sticker' ? 'box' : 'sticker',
      frontRight: centerId === 'card' ? 'can' : 'card'
    }
  }

  function mountSlotProduct(slot: HeroSlot, nextProdId: ProductId, animatePop = false) {
    if (slot.built) {
      slot.itemHolder.remove(slot.built.group)
      disposeObjectTree(slot.built.group)
      slot.built = null
    }
    slot.productId = nextProdId
    const meta = PRODUCT_CATALOG.find((p) => p.id === nextProdId) || PRODUCT_CATALOG[0]
    const tex = sharedTextures[meta.layout]
    const built = buildProductMockup(nextProdId, THREE, tex, colorHex.value, finish.value, {
      allowTransmission: quality.allowTransmission
    })
    built.group.traverse((o) => {
      o.userData.heroSlot = slot
    })
    slot.built = built
    slot.itemHolder.add(built.group)
    if (animatePop) {
      slot.swapAnimTime = 0
    }
  }

  function rebuildAllSlots(animateCenter = false) {
    const mapping = computeSlotProductIds(productId.value)
    for (const s of slots) {
      const targetId = mapping[s.key]
      mountSlotProduct(s, targetId, animateCenter && s.key === 'center')
    }
  }

  rebuildAllSlots(false)

  // Watchers: debounce brandName 150ms
  let brandDebounceTimer: ReturnType<typeof setTimeout> | null = null
  const stopWatchBrand = watch(brandName, () => {
    canvas.setAttribute('aria-label', dynamicAriaLabel.value)
    if (brandDebounceTimer) clearTimeout(brandDebounceTimer)
    brandDebounceTimer = setTimeout(() => {
      renderAllLabelTextures()
    }, 150)
  })

  const stopWatchVibe = watch(vibe, () => {
    renderAllLabelTextures()
  })

  const stopWatchColorFinish = watch([colorHex, finish], async () => {
    await renderAllLabelTextures()
    rebuildAllSlots(false)
  })

  const stopWatchProduct = watch(productId, (nextId) => {
    canvas.setAttribute('aria-label', dynamicAriaLabel.value)
    const mapping = computeSlotProductIds(nextId)
    for (const s of slots) {
      if (s.productId !== mapping[s.key]) {
        mountSlotProduct(s, mapping[s.key], s.key === 'center')
      }
    }
  })

  const stopWatchBackdrop = watch(backdropId, () => {
    stage.setBackdropColor(currentBackdropMeta.value.hex)
  })

  // Showreel timer (swaps center product every 4s, pauses 10s on user interaction)
  let pauseShowreelUntil = 0
  let lastShowreelSwap = performance.now()

  const pauseShowreelFor10s = () => {
    pauseShowreelUntil = performance.now() + 10000
    lastShowreelSwap = performance.now()
  }
  pauseShowreelFn = pauseShowreelFor10s

  focus3DStageFn = () => {
    const centerSlot = slots[0]
    if (centerSlot) centerSlot.bounceTime = 0
  }

  triggerPhotoFn = async () => {
    const slug = displayBrand.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'brand'
    await captureStagePng(renderer, scene, camera, `arc-lab-${slug}-hero.png`)
  }

  // Pointer parallax (camera max 6 deg orbit), hover raycast, click bounce/promote, turntable drag
  const raycaster = new THREE.Raycaster()
  const pointerNDC = new THREE.Vector2(99, 99)
  const projVec = new THREE.Vector3()
  const MAX_CAM_ORBIT = THREE.MathUtils.degToRad(6)

  let targetCamAzimuth = 0
  let targetCamElevOffset = 0
  let currentCamAzimuth = 0
  let currentCamElevOffset = 0

  let hoveredSlot: HeroSlot | null = null
  let pointerDown = false
  let dragStarted = false
  let downX = 0
  let downY = 0
  let lastX = 0
  let turntableYaw = 0
  let turntableVel = 0

  const updatePointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1)
    pointerNDC.set(nx, ny)
    targetCamAzimuth = THREE.MathUtils.clamp(nx, -1, 1) * MAX_CAM_ORBIT
    targetCamElevOffset = THREE.MathUtils.clamp(ny, -1, 1) * MAX_CAM_ORBIT * 0.55
  }

  const updateHoverOverlay = (slot: HeroSlot | null) => {
    if (!slot || !slot.built || isDraggingTurntable.value) {
      hoveredSlot = null
      isHoveringProduct.value = false
      hoveredCaption.visible = false
      return
    }
    hoveredSlot = slot
    isHoveringProduct.value = true
    const meta = PRODUCT_CATALOG.find((p) => p.id === slot.productId)
    slot.anchor.getWorldPosition(projVec)
    projVec.y += slot.built.bounds.height * slot.baseScale + 0.18
    projVec.project(camera)
    const w = stageEl.clientWidth
    const h = stageEl.clientHeight
    hoveredCaption.text = meta ? meta.name : slot.productId
    hoveredCaption.x = Math.min(w - 84, Math.max(84, (projVec.x * 0.5 + 0.5) * w))
    hoveredCaption.y = Math.min(h - 48, Math.max(32, (-projVec.y * 0.5 + 0.5) * h))
    hoveredCaption.visible = true
  }

  const pickHoveredSlot = (): HeroSlot | null => {
    raycaster.setFromCamera(pointerNDC, camera)
    const roots = slots.map((s) => s.itemHolder)
    const hits = raycaster.intersectObjects(roots, true)
    let obj: import('three').Object3D | null = hits[0]?.object || null
    while (obj) {
      if (obj.userData?.heroSlot) return obj.userData.heroSlot as HeroSlot
      obj = obj.parent
    }
    return null
  }

  const onPointerDown = (e: PointerEvent) => {
    pauseShowreelFor10s()
    pointerDown = true
    dragStarted = false
    downX = e.clientX
    downY = e.clientY
    lastX = e.clientX
    updatePointer(e.clientX, e.clientY)
  }

  const onPointerMove = (e: PointerEvent) => {
    updatePointer(e.clientX, e.clientY)

    if (pointerDown) {
      const dx = e.clientX - downX
      const dy = e.clientY - downY
      if (!dragStarted && Math.hypot(dx, dy) > 6) {
        if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) {
          pointerDown = false
          return
        }
        dragStarted = true
        isDraggingTurntable.value = true
        hoveredCaption.visible = false
      }
      if (dragStarted) {
        const stepX = e.clientX - lastX
        lastX = e.clientX
        const delta = stepX * 0.0075
        turntableYaw += delta
        turntableVel = delta
        return
      }
    }

    if (e.pointerType !== 'touch') {
      updateHoverOverlay(pickHoveredSlot())
    }
  }

  const onPointerUp = (e: PointerEvent) => {
    const wasTap = pointerDown && !dragStarted
    pointerDown = false
    isDraggingTurntable.value = false

    if (wasTap) {
      pauseShowreelFor10s()
      updatePointer(e.clientX, e.clientY)
      const hit = pickHoveredSlot()
      if (hit) {
        if (hit.key === 'center') {
          hit.bounceTime = 0
        } else {
          productId.value = hit.productId
          slots[0].bounceTime = 0
        }
      }
    }
  }

  const onPointerLeave = () => {
    pointerDown = false
    isDraggingTurntable.value = false
    targetCamAzimuth = 0
    targetCamElevOffset = 0
    updateHoverOverlay(null)
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  canvas.addEventListener('pointerleave', onPointerLeave, { passive: true })

  // Render loop + IntersectionObserver + ResizeObserver + document.hidden
  let rafId = 0
  let running = false
  let inView = true
  let prevTime = performance.now()

  const animate = (now: number) => {
    if (!running) return
    const dt = Math.min((now - prevTime) / 1000, 0.05)
    prevTime = now

    if (now > pauseShowreelUntil && now - lastShowreelSwap >= 4000) {
      lastShowreelSwap = now
      const idx = PRODUCT_CATALOG.findIndex((p) => p.id === productId.value)
      const next = PRODUCT_CATALOG[(idx + 1) % PRODUCT_CATALOG.length]
      productId.value = next.id
    }

    currentCamAzimuth += (targetCamAzimuth - currentCamAzimuth) * 0.065
    currentCamElevOffset += (targetCamElevOffset - currentCamElevOffset) * 0.065
    const elev = baseCamElev + currentCamElevOffset
    const horizDist = Math.cos(elev) * baseCamDist
    camera.position.set(
      Math.sin(currentCamAzimuth) * horizDist,
      lookTarget.y + Math.sin(elev) * baseCamDist,
      lookTarget.z + Math.cos(currentCamAzimuth) * horizDist
    )
    camera.lookAt(lookTarget)

    if (!isDraggingTurntable.value) {
      turntableYaw += turntableVel
      turntableVel *= 0.92
      if (Math.abs(turntableVel) < 0.00004) turntableVel = 0
    }
    turntable.rotation.y = turntableYaw

    for (const s of slots) {
      const targetLift = hoveredSlot === s ? 0.05 : 0
      const targetHoverSc = hoveredSlot === s ? 1.04 : 1.0
      s.hoverLift += (targetLift - s.hoverLift) * 0.14
      s.hoverScale += (targetHoverSc - s.hoverScale) * 0.14

      let popScale = 1
      let extraSpin = 0
      if (s.swapAnimTime >= 0) {
        s.swapAnimTime += dt
        const dur = 0.45
        if (s.swapAnimTime >= dur) {
          s.swapAnimTime = -1
        } else {
          const p = s.swapAnimTime / dur
          popScale = Math.max(0.05, easeOutBack(p))
          extraSpin = (1 - Math.pow(p, 0.65)) * Math.PI * 1.15
        }
      }

      let sx = s.baseScale * s.hoverScale * popScale
      let sy = s.baseScale * s.hoverScale * popScale
      let sz = s.baseScale * s.hoverScale * popScale
      let bounceY = 0

      if (s.bounceTime >= 0) {
        s.bounceTime += dt
        const bDur = 0.46
        if (s.bounceTime >= bDur) {
          s.bounceTime = -1
        } else {
          const p = s.bounceTime / bDur
          const decay = Math.exp(-4.5 * p)
          const wave = Math.sin(p * Math.PI * 3.0)
          sy *= 1 + wave * decay * 0.11
          sx *= 1 - wave * decay * 0.06
          sz *= 1 - wave * decay * 0.06
          bounceY = Math.abs(wave) * decay * 0.09
        }
      }

      s.itemHolder.position.y = s.hoverLift + bounceY
      s.itemHolder.rotation.y = extraSpin
      s.itemHolder.scale.set(sx, sy, sz)
    }

    if (hoveredSlot && hoveredCaption.visible) {
      updateHoverOverlay(hoveredSlot)
    }

    renderer.render(scene, camera)
    rafId = window.requestAnimationFrame(animate)
  }

  const startLoop = () => {
    if (!running && inView && !document.hidden) {
      running = true
      prevTime = performance.now()
      rafId = window.requestAnimationFrame(animate)
    }
  }

  const stopLoop = () => {
    if (running) {
      running = false
      window.cancelAnimationFrame(rafId)
    }
  }

  let io: IntersectionObserver | null = null
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        inView = entry.isIntersecting
        if (inView) startLoop()
        else stopLoop()
      },
      { threshold: 0.02 }
    )
    io.observe(stageEl)
  }

  let ro: ResizeObserver | null = null
  const onResize = () => {
    if (!stageWrapRef.value) return
    stage.resizeStage(stageWrapRef.value.clientWidth, stageWrapRef.value.clientHeight)
  }
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(onResize)
    ro.observe(stageEl)
  } else {
    window.addEventListener('resize', onResize)
  }

  const onVisChange = () => {
    if (document.hidden) stopLoop()
    else startLoop()
  }
  document.addEventListener('visibilitychange', onVisChange)

  sceneReady.value = true
  startLoop()

  cleanupFn = () => {
    stopLoop()
    if (brandDebounceTimer) clearTimeout(brandDebounceTimer)
    stopWatchBrand()
    stopWatchVibe()
    stopWatchColorFinish()
    stopWatchProduct()
    stopWatchBackdrop()
    io?.disconnect()
    ro?.disconnect()
    window.removeEventListener('resize', onResize)
    window.removeEventListener('scroll', onWindowScrollParallax)
    document.removeEventListener('visibilitychange', onVisChange)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerLeave)

    for (const s of slots) {
      if (s.built) disposeObjectTree(s.built.group)
      disposeObjectTree(s.blob)
    }
    for (const ly of layouts) {
      sharedTextures[ly]?.dispose()
    }
    stage.disposeStage()
  }
})

onBeforeUnmount(() => {
  cleanupFn?.()
  cleanupFn = null
  triggerPhotoFn = null
  focus3DStageFn = null
  pauseShowreelFn = null
})
</script>

<template>
  <section
    id="beranda"
    class="relative pt-10 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28 px-4 sm:px-6 lg:px-8 overflow-x-clip bg-gradient-to-b from-cream via-sand/55 to-cream"
  >
    <!-- Soft Warm Ambient Glow -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[56rem] h-[26rem] rounded-full bg-butter/25 blur-3xl opacity-70"
    ></div>

    <div class="max-w-7xl mx-auto relative">
      <!-- Editorial Headline + Studio Controls Row -->
      <div class="max-w-5xl mx-auto text-center">
        <p class="editorial-eyebrow text-terracotta-deep mb-5">
          Studio Desain Identitas &amp; Kemasan UMKM Indonesia
        </p>

        <!-- Large Fraunces Editorial Headline (72-96px desktop) -->
        <h1
          class="font-display text-[2.65rem] sm:text-6xl lg:text-[4.75rem] xl:text-[5.5rem] 2xl:text-[6rem] font-normal tracking-[-0.03em] leading-[1.02] text-espresso"
          :class="{ 'hero-words-static': staticFallback }"
        >
          <span class="sr-only">
            Brand-mu, langsung jadi kemasan, identitas, dan kebanggaan nyata.
          </span>
          <span aria-hidden="true" aria-live="off">
            Brand-mu, langsung jadi
            <br class="hidden sm:inline" />
            <span class="hero-word-rotator italic font-normal text-terracotta-deep">
              <span class="hero-word-item hero-word-item-0">kemasan.</span>
              <span class="hero-word-item hero-word-item-1">identitas.</span>
              <span class="hero-word-item hero-word-item-2">kebanggaan.</span>
            </span>
          </span>
        </h1>

        <p class="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-espresso/75 leading-relaxed">
          Logo berkarakter, kemasan siap cetak, dan konten sosmed yang tenang meyakinkan. Ketik nama usahamu di bawah dan lihat wujudnya langsung di panggung 3D.
        </p>

        <!-- Clean Pill Brand Input + Swatches -->
        <div class="mt-8 max-w-xl mx-auto">
          <div class="flex items-center justify-between px-4 mb-2">
            <label for="hero-brand-input" class="editorial-eyebrow text-espresso/65">
              Coba Nama Brand-mu
            </label>
            <span class="text-xs font-medium text-espresso/55">{{ brandName.length }}/18</span>
          </div>

          <div
            class="p-1.5 pl-5 rounded-full bg-cream border border-espresso/15 shadow-editorial flex items-center gap-2 focus-within:border-terracotta transition-colors duration-300"
          >
            <input
              id="hero-brand-input"
              :value="brandName"
              type="text"
              maxlength="18"
              placeholder="KOPI SENJA"
              class="flex-1 min-w-0 py-2 bg-transparent font-display text-lg sm:text-xl font-medium tracking-tight text-espresso placeholder:text-espresso/35 focus:outline-none"
              @input="onBrandInput"
            />
            <button
              type="button"
              class="pill-btn-primary px-5 py-2.5 text-sm shrink-0"
              @click="handleLihat3D"
            >
              Lihat di 3D
            </button>
          </div>

          <!-- Soft Ring Color Swatches -->
          <div class="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <span class="editorial-eyebrow text-espresso/60 mr-1">Palet:</span>
            <button
              v-for="sw in BRAND_SWATCHES"
              :key="sw.hex"
              type="button"
              :aria-label="`Pilih warna ${sw.name}`"
              :aria-pressed="colorHex.toLowerCase() === sw.hex.toLowerCase() ? 'true' : 'false'"
              class="w-7 h-7 rounded-full border border-espresso/15 flex items-center justify-center transition-all duration-300 ease-editorial"
              :class="
                colorHex.toLowerCase() === sw.hex.toLowerCase()
                  ? 'scale-110 ring-2 ring-terracotta ring-offset-2 ring-offset-cream shadow-editorial-sm'
                  : 'hover:scale-105'
              "
              :style="{ backgroundColor: sw.hex }"
              @click="
                colorHex = sw.hex;
                pauseShowreelFn?.();
              "
            >
              <span
                v-if="colorHex.toLowerCase() === sw.hex.toLowerCase()"
                class="text-[10px] font-semibold"
                :class="isLightSwatch(sw.hex) ? 'text-espresso' : 'text-cream'"
                aria-hidden="true"
              >✓</span>
            </button>
          </div>
        </div>

        <!-- Editorial Pill CTAs & Subtle Studio Proof -->
        <div class="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5">
          <a href="#harga" class="pill-btn-primary px-7 py-3.5 text-sm sm:text-base">
            <span>Mulai Proyek</span>
            <span aria-hidden="true">→</span>
          </a>
          <a href="#mixer" class="pill-btn-secondary px-7 py-3.5 text-sm sm:text-base">
            Eksplorasi Brand Mixer
          </a>
        </div>

        <div class="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-espresso/65">
          <span>120+ Brand UMKM</span>
          <span class="text-terracotta" aria-hidden="true">·</span>
          <span>Selesai 2–4 Hari Kerja</span>
          <span class="text-terracotta" aria-hidden="true">·</span>
          <span>3x Revisi Terarah &amp; File Master</span>
        </div>
      </div>

      <!-- Large Rounded 3D Product Showcase Stage with Parallax -->
      <div
        class="mt-10 sm:mt-14 transition-transform duration-300 ease-out will-change-transform"
        :style="{ transform: `translate3d(0, ${stageParallaxY}px, 0)` }"
      >
        <div
          ref="stageWrapRef"
          class="relative w-full h-[390px] sm:h-[490px] lg:h-[580px] rounded-[28px] border border-espresso/10 shadow-editorial-lg overflow-hidden select-none bg-sand"
        >
          <!-- Semi-Realistic Vector Fallback (SSR + Reduced Motion + No WebGL) with Live Reactive <text> -->
          <div
            v-if="!sceneReady || staticFallback"
            class="absolute inset-0 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 760 540"
              class="w-full h-full object-cover"
              role="img"
              :aria-label="`Pratinjau kemasan studio untuk merek ${displayBrand}`"
            >
              <defs>
                <linearGradient id="heroFallbackCyc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="currentBackdropMeta.hex" />
                  <stop offset="66%" :stop-color="currentBackdropMeta.hex" />
                  <stop offset="78%" stop-color="#DDD5C7" />
                  <stop offset="100%" :stop-color="currentBackdropMeta.hex" />
                </linearGradient>
                <radialGradient id="heroFallbackShadow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#1F1A17" stop-opacity="0.28" />
                  <stop offset="55%" stop-color="#1F1A17" stop-opacity="0.11" />
                  <stop offset="100%" stop-color="#1F1A17" stop-opacity="0" />
                </radialGradient>
                <linearGradient id="heroFallbackPouch" x1="0" y1="0" x2="1" y2="0.2">
                  <stop offset="0%" stop-color="#FAF7F2" />
                  <stop offset="48%" stop-color="#F1EAE0" />
                  <stop offset="100%" stop-color="#DAD1C2" />
                </linearGradient>
                <linearGradient id="heroFallbackGlass" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#4A2718" />
                  <stop offset="30%" stop-color="#6B3B25" />
                  <stop offset="78%" stop-color="#2E160D" />
                  <stop offset="100%" stop-color="#4A2718" />
                </linearGradient>
              </defs>

              <rect width="760" height="540" fill="url(#heroFallbackCyc)" />
              <ellipse cx="195" cy="436" rx="92" ry="22" fill="url(#heroFallbackShadow)" />
              <ellipse cx="380" cy="448" rx="126" ry="28" fill="url(#heroFallbackShadow)" />
              <ellipse cx="566" cy="436" rx="84" ry="20" fill="url(#heroFallbackShadow)" />

              <!-- Cup -->
              <g transform="translate(132, 182)">
                <line x1="68" y1="-34" x2="58" y2="42" :stroke="colorHex" stroke-width="10" stroke-linecap="round" />
                <polygon points="14,54 114,54 98,248 30,248" fill="#FAF7F2" />
                <polygon points="18,98 110,98 103,196 25,196" :fill="colorHex" />
                <text x="64" y="152" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="13" font-weight="600" fill="#FAF7F2">
                  {{ displayBrand.slice(0, 12) }}
                </text>
                <path d="M10,54 C14,14 114,14 118,54 Z" fill="#FFFFFF" fill-opacity="0.84" />
                <rect x="6" y="48" width="116" height="10" rx="5" fill="#EBE4DA" />
              </g>

              <!-- Bottle -->
              <g transform="translate(514, 132)">
                <rect x="36" y="0" width="36" height="32" rx="4" fill="#1F1A17" />
                <path d="M40,32 L40,78 C40,104 12,118 12,150 L12,292 C12,300 20,304 54,304 C88,304 96,300 96,292 L96,150 C96,118 68,104 68,78 L68,32 Z" fill="url(#heroFallbackGlass)" />
                <rect x="22" y="146" width="8" height="142" rx="4" fill="#FFFFFF" fill-opacity="0.3" />
                <rect x="12" y="168" width="84" height="102" rx="3" fill="#FAF7F2" />
                <rect x="18" y="176" width="72" height="5" :fill="colorHex" />
                <text x="54" y="224" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="11" font-weight="600" fill="#1F1A17">
                  {{ displayBrand.slice(0, 12) }}
                </text>
                <text x="54" y="244" text-anchor="middle" font-family="Inter, sans-serif" font-size="7.5" letter-spacing="1" fill="#6E655E">250ML STUDIO</text>
              </g>

              <!-- Center Standing Pouch -->
              <g transform="translate(274, 108)">
                <path d="M16,0 L196,0 L206,318 C206,332 170,338 106,338 C42,338 6,332 6,318 Z" fill="url(#heroFallbackPouch)" />
                <line x1="18" y1="38" x2="194" y2="38" stroke="#D4CABB" stroke-width="3.5" />
                <rect x="28" y="64" width="156" height="224" rx="8" fill="#FAF7F2" />
                <rect x="42" y="80" width="128" height="6" :fill="colorHex" />
                <path d="M92 153 A18 18 0 1 1 120 153" fill="none" :stroke="colorHex" stroke-width="3.8" stroke-linecap="round" />
                <circle cx="106" cy="142" r="4.5" :fill="colorHex" />
                <text x="106" y="204" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="18" font-weight="600" fill="#1F1A17">
                  {{ displayBrand }}
                </text>
                <text x="106" y="228" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" letter-spacing="1.2" fill="#5E564F">PRODUK PILIHAN · 250G</text>
              </g>
            </svg>
          </div>

          <!-- Client-Only Photoreal Three.js Canvas -->
          <ClientOnly>
            <div
              v-show="sceneReady && !staticFallback"
              ref="canvasMountRef"
              data-cursor-grow
              class="w-full h-full"
              :class="[
                isDraggingTurntable
                  ? 'cursor-grabbing'
                  : isHoveringProduct
                    ? 'cursor-pointer'
                    : 'cursor-grab'
              ]"
            ></div>
          </ClientOnly>

          <!-- Soft Warm Vignette Overlay -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgba(31,26,23,0.10)]"
          ></div>

          <!-- Camera Flash Overlay on "Foto!" -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 bg-cream z-30 transition-opacity duration-300"
            :class="cameraFlashActive ? 'opacity-90' : 'opacity-0'"
          ></div>

          <!-- Floating Editorial Caption Pill on Hover -->
          <div
            v-if="hoveredCaption.visible && sceneReady && !staticFallback"
            aria-hidden="true"
            class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full px-3.5 py-1.5 rounded-full bg-cream/92 backdrop-blur-md text-espresso border border-espresso/10 text-xs font-medium tracking-wide shadow-editorial-sm"
            :style="{ left: `${hoveredCaption.x}px`, top: `${hoveredCaption.y}px` }"
          >
            {{ hoveredCaption.text }}
          </div>

          <!-- Top-Left Studio Hint + Top-Right "Ganti warna" & "Foto!" Pill Controls -->
          <div
            v-if="sceneReady && !staticFallback"
            class="absolute top-4 inset-x-4 z-20 flex items-center justify-between gap-2 pointer-events-none"
          >
            <div class="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream/85 backdrop-blur-md border border-espresso/10 text-xs text-espresso/75">
              <span class="w-1.5 h-1.5 rounded-full bg-terracotta" aria-hidden="true"></span>
              <span>Geser panggung · Klik produk untuk fokus</span>
            </div>

            <div class="ml-auto flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                class="px-4 py-2 rounded-full bg-cream/90 hover:bg-cream backdrop-blur-md border border-espresso/10 text-xs font-medium text-espresso shadow-editorial-sm transition-all duration-300 ease-editorial hover:-translate-y-0.5"
                @click="handleCycleColor"
              >
                Ganti warna
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-full bg-espresso text-cream hover:bg-terracotta-deep text-xs font-medium shadow-editorial-sm transition-all duration-300 ease-editorial hover:-translate-y-0.5"
                @click="handleTakePhoto"
              >
                Foto!
              </button>
            </div>
          </div>

          <!-- Bottom Accessible Product Switcher Pill Tabs -->
          <div
            v-if="sceneReady && !staticFallback"
            class="absolute bottom-4 inset-x-4 z-20 flex items-center justify-center overflow-x-auto no-scrollbar py-0.5"
          >
            <div
              class="inline-flex items-center gap-1 p-1 rounded-full bg-cream/88 backdrop-blur-md border border-espresso/10 shadow-editorial-sm"
              role="group"
              aria-label="Pilih produk tengah di studio"
            >
              <button
                v-for="prod in heroTabProducts"
                :key="prod.id"
                type="button"
                :aria-pressed="productId === prod.id ? 'true' : 'false'"
                class="px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all duration-300 ease-editorial"
                :class="
                  productId === prod.id
                    ? 'bg-espresso text-cream shadow-sm'
                    : 'text-espresso/75 hover:text-espresso hover:bg-sand/70'
                "
                @click="selectHeroProduct(prod.id)"
              >
                {{ prod.shortName }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
