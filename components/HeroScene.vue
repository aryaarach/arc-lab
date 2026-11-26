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

const hoveredCaption = reactive({
  visible: false,
  text: '',
  x: 0,
  y: 0
})

// Keyboard-accessible product tabs along bottom studio bar
const heroTabProducts = PRODUCT_CATALOG

const displayBrand = computed(() => (brandName.value.trim() || 'KOPI SENJA').slice(0, 18).toUpperCase())

const currentProductIndex = computed(() => {
  const idx = PRODUCT_CATALOG.findIndex((p) => p.id === productId.value)
  return idx >= 0 ? idx : 0
})

const currentProductIndexLabel = computed(() =>
  `${String(currentProductIndex.value + 1).padStart(2, '0')}/${String(PRODUCT_CATALOG.length).padStart(2, '0')}`
)

const currentCenterProductMeta = computed(
  () => PRODUCT_CATALOG[currentProductIndex.value] || PRODUCT_CATALOG[0]
)

const currentBackdropMeta = computed(
  () => BACKDROP_PRESETS.find((b) => b.id === backdropId.value) || BACKDROP_PRESETS[0]
)

const dynamicAriaLabel = computed(() => {
  return `Studio foto 3D menampilkan ${currentCenterProductMeta.value.name}, Cup Minuman, Botol Kaca, Kartu Nama, dan Sticker Sheet dengan merek ${displayBrand.value}`
})

const trustStats = [
  { num: '120+', label: 'UMKM TERLAYANI' },
  { num: '7', label: 'HARI MAKSIMAL' },
  { num: '3x', label: 'REVISI TERARAH' }
]

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
  if (typeof window !== 'undefined' && stageWrapRef.value) {
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
  if (prefersReducedMotion || !isWebGLSupported()) {
    staticFallback.value = true
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
    return
  }

  const stageEl = stageWrapRef.value
  const mountEl = canvasMountRef.value
  if (!stageEl || !mountEl) return

  let stage: ReturnType<typeof setupStudioStage>
  try {
    stage = setupStudioStage(THREE, RoomEnvMod.RoomEnvironment, mountEl, currentBackdropMeta.value.hex, 29)
  } catch {
    staticFallback.value = true
    return
  }

  const { renderer, scene, camera, blobTexture, quality } = stage
  const canvas = renderer.domElement
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', dynamicAriaLabel.value)
  canvas.style.touchAction = 'pan-y'

  const lookTarget = new THREE.Vector3(0, 0.72, 0.15)
  const baseCamDist = 6.15
  const baseCamElev = 0.21
  camera.position.set(
    0,
    lookTarget.y + Math.sin(baseCamElev) * baseCamDist,
    lookTarget.z + Math.cos(baseCamElev) * baseCamDist
  )
  camera.lookAt(lookTarget)

  const turntable = new THREE.Group()
  scene.add(turntable)

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
    const idx = PRODUCT_CATALOG.findIndex((p) => p.id === slot.productId)
    const meta = PRODUCT_CATALOG[idx >= 0 ? idx : 0]
    const numStr = String((idx >= 0 ? idx : 0) + 1).padStart(2, '0')
    slot.anchor.getWorldPosition(projVec)
    projVec.y += slot.built.bounds.height * slot.baseScale + 0.18
    projVec.project(camera)
    const w = stageEl.clientWidth
    const h = stageEl.clientHeight
    hoveredCaption.text = `${numStr} / ${meta ? meta.name.toUpperCase() : slot.productId.toUpperCase()}`
    hoveredCaption.x = Math.min(w - 86, Math.max(86, (projVec.x * 0.5 + 0.5) * w))
    hoveredCaption.y = Math.min(h - 44, Math.max(28, (-projVec.y * 0.5 + 0.5) * h))
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
        const dur = 0.4
        if (s.swapAnimTime >= dur) {
          s.swapAnimTime = -1
        } else {
          const p = s.swapAnimTime / dur
          popScale = Math.max(0.05, easeOutBack(p))
          extraSpin = (1 - Math.pow(p, 0.65)) * Math.PI * 1.1
        }
      }

      let sx = s.baseScale * s.hoverScale * popScale
      let sy = s.baseScale * s.hoverScale * popScale
      let sz = s.baseScale * s.hoverScale * popScale
      let bounceY = 0

      if (s.bounceTime >= 0) {
        s.bounceTime += dt
        const bDur = 0.42
        if (s.bounceTime >= bDur) {
          s.bounceTime = -1
        } else {
          const p = s.bounceTime / bDur
          const decay = Math.exp(-4.5 * p)
          const wave = Math.sin(p * Math.PI * 3.0)
          sy *= 1 + wave * decay * 0.1
          sx *= 1 - wave * decay * 0.055
          sz *= 1 - wave * decay * 0.055
          bounceY = Math.abs(wave) * decay * 0.08
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
  <section id="beranda" class="pt-10 sm:pt-14 lg:pt-20 pb-16 sm:pb-24 bg-white">
    <div class="swiss-container">
      <!-- Top Mono Caption Row -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 sm:pb-8">
        <p class="swiss-mono text-black flex items-center gap-2.5">
          <span class="inline-block w-2 h-2 rounded-full bg-signal" aria-hidden="true"></span>
          <span>ARC LAB / STUDIO DESAIN UMKM / 2026</span>
        </p>
        <p class="hidden sm:block swiss-mono text-dark-gray">
          INDONESIA · 100% ONLINE · FILE MASTER LENGKAP
        </p>
      </div>

      <!-- Enormous 9-Col Grotesk Headline + 3-Col Lead Copy -->
      <div class="swiss-grid items-end gap-y-6">
        <div class="col-span-4 lg:col-span-9">
          <h1
            class="font-display font-medium text-[56px] sm:text-[84px] lg:text-[112px] xl:text-[136px] 2xl:text-[152px] tracking-[-0.035em] leading-[0.93] text-black text-left"
          >
            Brand-mu,<br />
            langsung jadi<br />
            kemasan<span class="text-signal">.</span>
          </h1>
        </div>

        <div class="col-span-4 lg:col-span-3 lg:pb-2">
          <p class="text-base sm:text-lg text-dark-gray leading-relaxed text-left max-w-sm">
            Sistem identitas, kemasan produk siap cetak, dan konten sosmed presisi untuk UMKM. Ketik merek usahamu untuk menguji pratinjau studio 3D secara langsung.
          </p>
        </div>
      </div>

      <!-- 12-Col Controls, Swatches, CTAs & Large Numeral Trust Stats Row -->
      <div class="mt-10 sm:mt-14 pt-8 pb-10 border-t border-line swiss-grid gap-y-8 items-end">
        <!-- Cols 1-5: Underlined Brand Input + 6 Plain Circle Swatches -->
        <div class="col-span-4 lg:col-span-5 flex flex-col gap-5">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="hero-brand-input" class="swiss-mono text-dark-gray">
                01 / KETIK NAMA BRAND
              </label>
              <span class="swiss-mono text-dark-gray">{{ brandName.length }}/18</span>
            </div>

            <div class="flex items-end gap-3">
              <input
                id="hero-brand-input"
                :value="brandName"
                type="text"
                maxlength="18"
                placeholder="KOPI SENJA"
                class="flex-1 min-w-0 px-0 py-2 bg-transparent border-0 border-b border-black rounded-none font-display text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-black placeholder:text-mid-gray focus:border-signal focus:outline-none transition-colors duration-300"
                @input="onBrandInput"
              />
              <button
                type="button"
                class="group swiss-btn-secondary px-4 py-2.5 text-xs sm:text-sm shrink-0"
                @click="handleLihat3D"
              >
                <span>Lihat di 3D</span>
                <span class="swiss-arrow" aria-hidden="true">↗</span>
              </button>
            </div>
          </div>

          <!-- 6 Plain Circle Swatches -->
          <div class="flex flex-wrap items-center gap-3">
            <span class="swiss-mono text-dark-gray mr-1">WARNA:</span>
            <button
              v-for="sw in BRAND_SWATCHES"
              :key="sw.hex"
              type="button"
              :aria-label="`Pilih warna ${sw.name}`"
              :aria-pressed="colorHex.toLowerCase() === sw.hex.toLowerCase() ? 'true' : 'false'"
              class="w-6 h-6 rounded-full border border-black/15 transition-transform duration-300 ease-out"
              :class="
                colorHex.toLowerCase() === sw.hex.toLowerCase()
                  ? 'ring-2 ring-signal ring-offset-2 ring-offset-white scale-110'
                  : 'hover:scale-110'
              "
              :style="{ backgroundColor: sw.hex }"
              @click="
                colorHex = sw.hex;
                pauseShowreelFn?.();
              "
            ></button>
          </div>
        </div>

        <!-- Cols 6-9: Rectangular Primary & Outline CTAs -->
        <div class="col-span-4 lg:col-span-4 flex flex-wrap items-center gap-3">
          <a
            href="#harga"
            class="group swiss-btn-primary px-6 py-3.5 text-sm sm:text-base"
          >
            <span>Mulai Proyek</span>
            <span class="swiss-arrow" aria-hidden="true">↗</span>
          </a>
          <a
            href="#mixer"
            class="group swiss-btn-secondary px-6 py-3.5 text-sm sm:text-base"
          >
            <span>Coba Brand Mixer</span>
            <span class="swiss-arrow" aria-hidden="true">↗</span>
          </a>
        </div>

        <!-- Cols 10-12: Trust Stats as Large Numerals with Small Captions -->
        <div
          class="col-span-4 lg:col-span-3 grid grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-line pt-6 lg:pt-0 lg:pl-6"
        >
          <div v-for="stat in trustStats" :key="stat.num" class="text-left">
            <div class="font-display text-3xl xl:text-4xl font-semibold tracking-[-0.03em] leading-none text-black">
              {{ stat.num }}
            </div>
            <div class="swiss-mono text-dark-gray mt-2">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Sharp-Cornered 1px Border Three.js Product Showcase Frame -->
      <div class="border border-black bg-white rounded-none">
        <!-- Top Mono Caption Bar (Product Name + Index 01/10 + Controls) -->
        <div class="px-4 sm:px-5 py-3 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-white">
          <div class="flex flex-wrap items-center gap-3 swiss-mono text-black">
            <span class="text-signal font-semibold">{{ currentProductIndexLabel }}</span>
            <span class="text-line" aria-hidden="true">/</span>
            <span>{{ currentCenterProductMeta.name }}</span>
            <span class="text-line" aria-hidden="true">/</span>
            <span class="text-dark-gray">{{ displayBrand }}</span>
          </div>

          <div
            v-if="sceneReady && !staticFallback"
            class="flex items-center gap-2"
          >
            <button
              type="button"
              class="px-3 py-1.5 rounded-none border border-black bg-white text-black swiss-mono hover:bg-black hover:text-white transition-colors duration-300 ease-out"
              @click="handleCycleColor"
            >
              Ganti warna
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-none border border-black bg-black text-white swiss-mono hover:bg-signal hover:border-signal transition-colors duration-300 ease-out"
              @click="handleTakePhoto"
            >
              Foto!
            </button>
          </div>
        </div>

        <!-- Reserved-Height Neutral Studio Viewport (Zero CLS) -->
        <div
          ref="stageWrapRef"
          class="relative h-[380px] sm:h-[480px] lg:h-[580px] overflow-hidden select-none bg-off-white"
        >
          <!-- Neutral Studio Vector Fallback (SSR + Reduced Motion + No WebGL) -->
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
                <linearGradient id="heroSwissCyc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#E8E8E4" />
                  <stop offset="64%" stop-color="#F2F2F0" />
                  <stop offset="78%" stop-color="#E2E2DE" />
                  <stop offset="100%" stop-color="#F2F2F0" />
                </linearGradient>
                <radialGradient id="heroSwissShadow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#0A0A0A" stop-opacity="0.28" />
                  <stop offset="55%" stop-color="#0A0A0A" stop-opacity="0.10" />
                  <stop offset="100%" stop-color="#0A0A0A" stop-opacity="0" />
                </radialGradient>
                <linearGradient id="heroSwissPouch" x1="0" y1="0" x2="1" y2="0.2">
                  <stop offset="0%" stop-color="#FFFFFF" />
                  <stop offset="50%" stop-color="#F2F2F0" />
                  <stop offset="100%" stop-color="#DADAD6" />
                </linearGradient>
                <linearGradient id="heroSwissGlass" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#262624" />
                  <stop offset="30%" stop-color="#3E3E3A" />
                  <stop offset="78%" stop-color="#141413" />
                  <stop offset="100%" stop-color="#262624" />
                </linearGradient>
              </defs>

              <rect width="760" height="540" fill="url(#heroSwissCyc)" />
              <ellipse cx="195" cy="436" rx="92" ry="20" fill="url(#heroSwissShadow)" />
              <ellipse cx="380" cy="448" rx="126" ry="26" fill="url(#heroSwissShadow)" />
              <ellipse cx="566" cy="436" rx="84" ry="18" fill="url(#heroSwissShadow)" />

              <!-- Cup -->
              <g transform="translate(132, 182)">
                <line x1="68" y1="-34" x2="58" y2="42" :stroke="colorHex" stroke-width="9" stroke-linecap="butt" />
                <polygon points="14,54 114,54 98,248 30,248" fill="#FFFFFF" />
                <polygon points="18,98 110,98 103,196 25,196" :fill="colorHex" />
                <text x="64" y="152" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">
                  {{ displayBrand.slice(0, 12) }}
                </text>
                <path d="M10,54 C14,14 114,14 118,54 Z" fill="#FFFFFF" fill-opacity="0.86" />
                <rect x="6" y="48" width="116" height="9" fill="#E4E4E0" />
              </g>

              <!-- Bottle -->
              <g transform="translate(514, 132)">
                <rect x="36" y="0" width="36" height="32" fill="#0A0A0A" />
                <path d="M40,32 L40,78 C40,104 12,118 12,150 L12,292 C12,300 20,304 54,304 C88,304 96,300 96,292 L96,150 C96,118 68,104 68,78 L68,32 Z" fill="url(#heroSwissGlass)" />
                <rect x="22" y="146" width="7" height="142" fill="#FFFFFF" fill-opacity="0.28" />
                <rect x="12" y="168" width="84" height="102" fill="#FFFFFF" />
                <rect x="18" y="176" width="72" height="5" :fill="colorHex" />
                <text x="54" y="224" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="11" font-weight="600" fill="#0A0A0A">
                  {{ displayBrand.slice(0, 12) }}
                </text>
                <text x="54" y="244" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" fill="#8A8A86">01 / 250ML</text>
              </g>

              <!-- Center Standing Pouch -->
              <g transform="translate(274, 108)">
                <path d="M16,0 L196,0 L206,318 C206,332 170,338 106,338 C42,338 6,332 6,318 Z" fill="url(#heroSwissPouch)" />
                <line x1="18" y1="38" x2="194" y2="38" stroke="#D9D9D5" stroke-width="2" />
                <rect x="28" y="64" width="156" height="224" fill="#FFFFFF" stroke="#D9D9D5" stroke-width="1" />
                <rect x="42" y="80" width="128" height="5" :fill="colorHex" />
                <path d="M92 154 A20 20 0 1 1 120 154" fill="none" stroke="#0A0A0A" stroke-width="3.5" />
                <circle cx="106" cy="140" r="5" :fill="colorHex" />
                <text x="106" y="204" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="18" font-weight="600" fill="#0A0A0A">
                  {{ displayBrand }}
                </text>
                <text x="106" y="228" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#8A8A86">PRODUK PILIHAN · 250G</text>
              </g>
            </svg>
          </div>

          <!-- Client-Only Lazy Three.js Stage -->
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

          <!-- Camera Flash Overlay on "Foto!" -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 bg-white z-30 transition-opacity duration-300 ease-out"
            :class="cameraFlashActive ? 'opacity-90' : 'opacity-0'"
          ></div>

          <!-- Sharp 1px Swiss Hover Caption Tag -->
          <div
            v-if="hoveredCaption.visible && sceneReady && !staticFallback"
            aria-hidden="true"
            class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full px-2.5 py-1.5 bg-white text-black border border-black swiss-mono whitespace-nowrap"
            :style="{ left: `${hoveredCaption.x}px`, top: `${hoveredCaption.y}px` }"
          >
            {{ hoveredCaption.text }}
          </div>
        </div>

        <!-- Bottom Accessible Product Switcher Bar -->
        <div
          v-if="sceneReady && !staticFallback"
          class="px-4 sm:px-5 border-t border-line bg-white flex items-center justify-between gap-6 overflow-x-auto no-scrollbar"
        >
          <div class="flex items-center gap-5" role="group" aria-label="Pilih produk tengah di studio">
            <button
              v-for="(prod, pIdx) in heroTabProducts"
              :key="prod.id"
              type="button"
              :aria-pressed="productId === prod.id ? 'true' : 'false'"
              class="py-3 -mb-px border-b-2 inline-flex items-baseline gap-1.5 shrink-0 transition-colors duration-300 ease-out"
              :class="
                productId === prod.id
                  ? 'border-signal text-black font-medium'
                  : 'border-transparent text-dark-gray hover:text-black'
              "
              @click="selectHeroProduct(prod.id)"
            >
              <span
                class="swiss-mono"
                :class="productId === prod.id ? 'text-signal' : 'text-mid-gray'"
              >
                {{ String(pIdx + 1).padStart(2, '0') }}
              </span>
              <span class="text-xs sm:text-sm tracking-[-0.01em]">{{ prod.shortName }}</span>
            </button>
          </div>

          <span class="hidden xl:inline swiss-mono text-dark-gray shrink-0">
            GESER PANGGUNG · KLIK OBJEK UNTUK PANTUL
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
