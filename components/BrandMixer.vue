<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  useBrandState,
  PRODUCT_CATALOG,
  VIBE_LIST,
  FINISH_LIST,
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

const config = useAppConfig()

const {
  brandName,
  vibe,
  colorHex,
  finish,
  productId,
  backdropId,
  setBrandName,
  randomizeBrandSetup
} = useBrandState()

type ViewportMode = 'single' | 'kit'
const viewportMode = ref<ViewportMode>('single')

const stageContainerRef = ref<HTMLElement | null>(null)
const webglUnavailable = ref(false)
const fallbackLabelDataUrl = ref('')
const isHoveringMesh = ref(false)
const snapshotFlash = ref(false)

const displayBrand = computed(() => (brandName.value.trim() || 'KOPI SENJA').slice(0, 18).toUpperCase())

const selectedProductIndex = computed(() => {
  const idx = PRODUCT_CATALOG.findIndex((p) => p.id === productId.value)
  return idx >= 0 ? idx : 0
})

const selectedProductIndexLabel = computed(() =>
  `${String(selectedProductIndex.value + 1).padStart(2, '0')}/${String(PRODUCT_CATALOG.length).padStart(2, '0')}`
)

const selectedProductMeta = computed(
  () => PRODUCT_CATALOG[selectedProductIndex.value] || PRODUCT_CATALOG[0]
)

const selectedColorMeta = computed(
  () =>
    BRAND_SWATCHES.find((c) => c.hex.toLowerCase() === colorHex.value.toLowerCase()) || {
      name: 'Kustom',
      hex: colorHex.value
    }
)

const selectedBackdropMeta = computed(
  () => BACKDROP_PRESETS.find((b) => b.id === backdropId.value) || BACKDROP_PRESETS[0]
)

const canvasAriaLabel = computed(() =>
  viewportMode.value === 'kit'
    ? `Studio Brand Kit 3D menampilkan seluruh 10 produk kemasan untuk merek ${displayBrand.value} dengan gaya ${vibe.value}`
    : `Pratinjau foto studio 3D ${selectedProductMeta.value.name} untuk merek ${displayBrand.value}, gaya ${vibe.value}, hasil akhir ${finish.value}, latar ${selectedBackdropMeta.value.name}`
)

const waDeepLink = computed(() => {
  const msg = [
    'Halo Arc Lab! Saya sudah merancang konsep di *Studio Foto Kemasan 3D* dan ingin konsultasi:',
    `• Nama Brand: ${displayBrand.value}`,
    `• Produk Utama: ${selectedProductMeta.value.name}`,
    `• Gaya Visual: ${vibe.value}`,
    `• Warna: ${selectedColorMeta.value.name} (${selectedColorMeta.value.hex})`,
    `• Material / Finish: ${finish.value}`,
    `• Latar Foto Studio: ${selectedBackdropMeta.value.name}`,
    '',
    'Boleh info estimasi pengerjaan dan langkah selanjutnya?'
  ].join('\n')
  return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(msg)}`
})

async function refreshFallback2DImage() {
  if (!webglUnavailable.value || typeof document === 'undefined') return
  const cv = await drawLabel(displayBrand.value, vibe.value, colorHex.value, selectedProductMeta.value.layout, 0.75)
  fallbackLabelDataUrl.value = cv.toDataURL('image/png')
}

let triggerBounceFn: (() => void) | null = null
let downloadPngFn: (() => Promise<void>) | null = null
let cleanupStageFn: (() => void) | null = null

function onBrandInputChange(e: Event) {
  setBrandName((e.target as HTMLInputElement).value)
}

function handleBounceClick() {
  triggerBounceFn?.()
}

function handleRandomizeClick() {
  randomizeBrandSetup()
  triggerBounceFn?.()
}

async function handleDownloadPng() {
  snapshotFlash.value = true
  setTimeout(() => {
    snapshotFlash.value = false
  }, 300)
  await downloadPngFn?.()
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  await nextTick()

  if (!isWebGLAvailable()) {
    webglUnavailable.value = true
    await refreshFallback2DImage()
    return
  }

  let THREE: typeof import('three')
  let OrbitMod: typeof import('three/addons/controls/OrbitControls.js')
  let RoomEnvMod: typeof import('three/addons/environments/RoomEnvironment.js')

  try {
    ;[THREE, OrbitMod, RoomEnvMod] = await Promise.all([
      import('three'),
      import('three/addons/controls/OrbitControls.js'),
      import('three/addons/environments/RoomEnvironment.js')
    ])
  } catch {
    webglUnavailable.value = true
    await refreshFallback2DImage()
    return
  }

  const containerEl = stageContainerRef.value
  if (!containerEl) return

  let stage: ReturnType<typeof setupStudioStage>
  try {
    stage = setupStudioStage(THREE, RoomEnvMod.RoomEnvironment, containerEl, selectedBackdropMeta.value.hex, 30)
  } catch {
    webglUnavailable.value = true
    await refreshFallback2DImage()
    return
  }

  const { renderer, scene, camera, blobTexture, quality } = stage
  const canvas = renderer.domElement
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', canvasAriaLabel.value)
  canvas.style.touchAction = 'pan-y'

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  camera.position.set(0, 1.48, 4.55)
  const controls = new OrbitMod.OrbitControls(camera, canvas)
  controls.target.set(0, 0.72, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.065
  controls.autoRotate = !prefersReduced
  controls.autoRotateSpeed = 1.15
  controls.enableZoom = false
  controls.enablePan = false
  controls.minPolarAngle = Math.PI * 0.18
  controls.maxPolarAngle = Math.PI * 0.475
  controls.update()

  const sharedTextures = {} as Record<LabelLayout, import('three').CanvasTexture>
  const layouts: LabelLayout[] = ['front', 'wrap', 'card', 'sticker']

  const updateAllLabelTextures = async () => {
    const scale = quality.isLowEnd ? 0.75 : 1
    await Promise.all(
      layouts.map(async (ly) => {
        const cv = await drawLabel(displayBrand.value, vibe.value, colorHex.value, ly, scale)
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

  await updateAllLabelTextures()

  const singleStageGroup = new THREE.Group()
  scene.add(singleStageGroup)

  const singleBlob = createContactBlobMesh(THREE, blobTexture, 0.82, 0.62, 0.36)
  singleStageGroup.add(singleBlob)

  interface TransitioningSingle {
    holder: import('three').Group
    built: MockupBuildResult
    phase: 'in' | 'steady' | 'out'
    timer: number
  }

  let activeSingle: TransitioningSingle | null = null
  const outgoingSingles: TransitioningSingle[] = []
  let bounceTimer = -1

  function setGroupOpacityFade(group: import('three').Group, alpha: number) {
    group.traverse((o) => {
      const m = o as import('three').Mesh
      if (!m.isMesh) return
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      for (const mat of mats) {
        if (!mat) continue
        mat.transparent = true
        mat.opacity = Math.min(mat.opacity, alpha)
      }
    })
  }

  function spawnSingleProduct(id: ProductId, animateTransition: boolean) {
    if (activeSingle) {
      if (animateTransition && !prefersReduced) {
        activeSingle.phase = 'out'
        activeSingle.timer = 0
        outgoingSingles.push(activeSingle)
      } else {
        singleStageGroup.remove(activeSingle.holder)
        disposeObjectTree(activeSingle.built.group)
      }
      activeSingle = null
    }

    const meta = PRODUCT_CATALOG.find((p) => p.id === id) || PRODUCT_CATALOG[0]
    const built = buildProductMockup(id, THREE, sharedTextures[meta.layout], colorHex.value, finish.value, {
      allowTransmission: quality.allowTransmission
    })
    const holder = new THREE.Group()
    built.group.traverse((o) => {
      o.userData.productId = id
    })
    holder.add(built.group)
    if (animateTransition && !prefersReduced) {
      holder.scale.setScalar(0.05)
    }
    singleStageGroup.add(holder)

    activeSingle = {
      holder,
      built,
      phase: animateTransition && !prefersReduced ? 'in' : 'steady',
      timer: 0
    }
  }

  const brandKitGroup = new THREE.Group()
  brandKitGroup.visible = false
  scene.add(brandKitGroup)

  interface KitEntry {
    id: ProductId
    anchor: import('three').Group
    holder: import('three').Group
    blob: import('three').Mesh
    built: MockupBuildResult
    focusTarget: import('three').Vector3
    bounceTime: number
  }

  let kitEntries: KitEntry[] = []

  const kitPositions: [number, number, number][] = [
    [-3.1, -0.78, 0.14],
    [-1.55, -0.86, 0.08],
    [0.0, -0.92, 0.0],
    [1.55, -0.86, -0.08],
    [3.1, -0.78, -0.14],
    [-2.45, 0.85, 0.18],
    [-1.22, 0.92, 0.09],
    [0.0, 0.96, 0.0],
    [1.22, 0.92, -0.09],
    [2.45, 0.85, -0.18]
  ]

  function clearBrandKit() {
    for (const k of kitEntries) {
      disposeObjectTree(k.built.group)
      disposeObjectTree(k.blob)
      brandKitGroup.remove(k.anchor)
    }
    kitEntries = []
  }

  function buildBrandKitAll10() {
    clearBrandKit()
    PRODUCT_CATALOG.forEach((meta, idx) => {
      const [px, pz, ry] = kitPositions[idx] || [0, 0, 0]
      const anchor = new THREE.Group()
      anchor.position.set(px, 0, pz)
      anchor.rotation.y = ry

      const blob = createContactBlobMesh(THREE, blobTexture, 0.64, 0.5, 0.34)
      anchor.add(blob)

      const holder = new THREE.Group()
      const built = buildProductMockup(meta.id, THREE, sharedTextures[meta.layout], colorHex.value, finish.value, {
        allowTransmission: quality.allowTransmission
      })
      built.group.traverse((o) => {
        o.userData.productId = meta.id
      })
      holder.add(built.group)
      anchor.add(holder)
      brandKitGroup.add(anchor)

      kitEntries.push({
        id: meta.id,
        anchor,
        holder,
        blob,
        built,
        focusTarget: new THREE.Vector3(px, Math.max(0.45, built.bounds.height * 0.48), pz),
        bounceTime: -1
      })
    })
  }

  const camFlight = {
    active: false,
    elapsed: 0,
    duration: 0.5,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3()
  }

  function flyCameraTo(toPos: import('three').Vector3, toTarget: import('three').Vector3, duration = 0.5) {
    if (prefersReduced) {
      camera.position.copy(toPos)
      controls.target.copy(toTarget)
      controls.update()
      return
    }
    camFlight.fromPos.copy(camera.position)
    camFlight.toPos.copy(toPos)
    camFlight.fromTarget.copy(controls.target)
    camFlight.toTarget.copy(toTarget)
    camFlight.elapsed = 0
    camFlight.duration = duration
    camFlight.active = true
  }

  function flyToKitProduct(id: ProductId) {
    const entry = kitEntries.find((k) => k.id === id)
    if (!entry) return
    entry.bounceTime = 0
    const offsetPos = entry.focusTarget.clone().add(new THREE.Vector3(0.45, 0.95, 3.35))
    flyCameraTo(offsetPos, entry.focusTarget, 0.5)
  }

  spawnSingleProduct(productId.value, false)

  let brandTimer: ReturnType<typeof setTimeout> | null = null
  const stopBrandWatch = watch(brandName, () => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    if (brandTimer) clearTimeout(brandTimer)
    brandTimer = setTimeout(async () => {
      await updateAllLabelTextures()
    }, 150)
  })

  const stopVibeWatch = watch(vibe, async () => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    await updateAllLabelTextures()
  })

  const stopColorFinishWatch = watch([colorHex, finish], async () => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    await updateAllLabelTextures()
    if (viewportMode.value === 'single') {
      spawnSingleProduct(productId.value, false)
    } else {
      buildBrandKitAll10()
    }
  })

  const stopProductWatch = watch(productId, (nextId) => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    if (viewportMode.value === 'single') {
      spawnSingleProduct(nextId, true)
    } else {
      flyToKitProduct(nextId)
    }
  })

  const stopBackdropWatch = watch(backdropId, () => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    stage.setBackdropColor(selectedBackdropMeta.value.hex)
  })

  const stopModeWatch = watch(viewportMode, (mode) => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    if (mode === 'kit') {
      singleStageGroup.visible = false
      buildBrandKitAll10()
      brandKitGroup.visible = true
      controls.autoRotate = false
      flyCameraTo(new THREE.Vector3(0, 3.15, 9.2), new THREE.Vector3(0, 0.55, 0.1), 0.5)
    } else {
      brandKitGroup.visible = false
      clearBrandKit()
      singleStageGroup.visible = true
      spawnSingleProduct(productId.value, false)
      controls.autoRotate = !prefersReduced
      flyCameraTo(new THREE.Vector3(0, 1.48, 4.55), new THREE.Vector3(0, 0.72, 0), 0.45)
    }
  })

  triggerBounceFn = () => {
    if (viewportMode.value === 'single') {
      bounceTimer = 0
    } else {
      const entry = kitEntries.find((k) => k.id === productId.value)
      if (entry) entry.bounceTime = 0
    }
  }

  downloadPngFn = async () => {
    const slug = displayBrand.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'brand'
    const modeSlug = viewportMode.value === 'kit' ? 'brand-kit' : productId.value
    await captureStagePng(renderer, scene, camera, `arc-lab-${slug}-${modeSlug}.png`)
  }

  const raycaster = new THREE.Raycaster()
  const pointerNDC = new THREE.Vector2()
  let downPos = { x: 0, y: 0 }

  const getHitProductId = (clientX: number, clientY: number): ProductId | null => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    pointerNDC.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1)
    )
    raycaster.setFromCamera(pointerNDC, camera)
    const rootTarget = viewportMode.value === 'kit' ? brandKitGroup : singleStageGroup
    const hits = raycaster.intersectObject(rootTarget, true)
    for (const h of hits) {
      let cur: import('three').Object3D | null = h.object
      while (cur) {
        if (cur.userData?.productId) return cur.userData.productId as ProductId
        cur = cur.parent
      }
    }
    return null
  }

  const onPointerDown = (e: PointerEvent) => {
    downPos = { x: e.clientX, y: e.clientY }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    isHoveringMesh.value = !!getHitProductId(e.clientX, e.clientY)
  }

  const onPointerUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return
    const hitId = getHitProductId(e.clientX, e.clientY)
    if (!hitId) return
    if (viewportMode.value === 'kit') {
      if (productId.value === hitId) {
        flyToKitProduct(hitId)
      } else {
        productId.value = hitId
      }
    } else {
      bounceTimer = 0
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove, { passive: true })
  canvas.addEventListener('pointerup', onPointerUp)

  let rafId = 0
  let running = false
  let inView = true
  let prevNow = performance.now()

  const tick = (now: number) => {
    if (!running) return
    const dt = Math.min((now - prevNow) / 1000, 0.05)
    prevNow = now

    if (camFlight.active) {
      camFlight.elapsed += dt
      const t = Math.min(1, camFlight.elapsed / camFlight.duration)
      const e = easeOutCubic(t)
      camera.position.lerpVectors(camFlight.fromPos, camFlight.toPos, e)
      controls.target.lerpVectors(camFlight.fromTarget, camFlight.toTarget, e)
      if (t >= 1) camFlight.active = false
    }

    if (activeSingle) {
      let baseS = 1
      if (activeSingle.phase === 'in') {
        activeSingle.timer += dt
        const p = Math.min(1, activeSingle.timer / 0.35)
        baseS = Math.max(0.05, easeOutBack(p))
        if (p >= 1) activeSingle.phase = 'steady'
      }

      let sx = baseS
      let sy = baseS
      let sz = baseS
      let by = 0
      if (bounceTimer >= 0) {
        bounceTimer += dt
        const dur = 0.42
        if (bounceTimer >= dur) {
          bounceTimer = -1
        } else {
          const p = bounceTimer / dur
          const decay = Math.exp(-4.5 * p)
          const wave = Math.sin(p * Math.PI * 3.0)
          sy *= 1 + wave * decay * 0.08
          sx *= 1 - wave * decay * 0.045
          sz *= 1 - wave * decay * 0.045
          by = Math.abs(wave) * decay * 0.06
        }
      }

      activeSingle.holder.scale.set(sx, sy, sz)
      activeSingle.holder.position.y = by
    }

    for (let i = outgoingSingles.length - 1; i >= 0; i--) {
      const out = outgoingSingles[i]
      out.timer += dt
      const p = Math.min(1, out.timer / 0.24)
      const sc = Math.max(0.01, 1 - p * 0.75)
      out.holder.scale.setScalar(sc)
      setGroupOpacityFade(out.built.group, 1 - p)
      if (p >= 1) {
        singleStageGroup.remove(out.holder)
        disposeObjectTree(out.built.group)
        outgoingSingles.splice(i, 1)
      }
    }

    if (viewportMode.value === 'kit') {
      for (const entry of kitEntries) {
        if (entry.bounceTime >= 0) {
          entry.bounceTime += dt
          const dur = 0.42
          if (entry.bounceTime >= dur) {
            entry.bounceTime = -1
            entry.holder.scale.set(1, 1, 1)
            entry.holder.position.y = 0
          } else {
            const p = entry.bounceTime / dur
            const decay = Math.exp(-4.5 * p)
            const wave = Math.sin(p * Math.PI * 3.0)
            entry.holder.scale.set(
              1 - wave * decay * 0.045,
              1 + wave * decay * 0.08,
              1 - wave * decay * 0.045
            )
            entry.holder.position.y = Math.abs(wave) * decay * 0.06
          }
        }
      }
    }

    controls.update()
    renderer.render(scene, camera)
    rafId = window.requestAnimationFrame(tick)
  }

  const startLoop = () => {
    if (!running && inView && !document.hidden) {
      running = true
      prevNow = performance.now()
      rafId = window.requestAnimationFrame(tick)
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
    io.observe(containerEl)
  }

  let ro: ResizeObserver | null = null
  const onResize = () => {
    if (!stageContainerRef.value) return
    stage.resizeStage(stageContainerRef.value.clientWidth, stageContainerRef.value.clientHeight)
  }
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(onResize)
    ro.observe(containerEl)
  } else {
    window.addEventListener('resize', onResize)
  }

  const onVisChange = () => {
    if (document.hidden) stopLoop()
    else startLoop()
  }
  document.addEventListener('visibilitychange', onVisChange)

  startLoop()

  cleanupStageFn = () => {
    stopLoop()
    if (brandTimer) clearTimeout(brandTimer)
    stopBrandWatch()
    stopVibeWatch()
    stopColorFinishWatch()
    stopProductWatch()
    stopBackdropWatch()
    stopModeWatch()
    io?.disconnect()
    ro?.disconnect()
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisChange)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    controls.dispose()

    if (activeSingle) disposeObjectTree(activeSingle.built.group)
    for (const out of outgoingSingles) disposeObjectTree(out.built.group)
    disposeObjectTree(singleBlob)
    clearBrandKit()
    for (const ly of layouts) sharedTextures[ly]?.dispose()
    stage.disposeStage()
  }
})

watch([brandName, vibe, colorHex, productId], () => {
  if (webglUnavailable.value) {
    refreshFallback2DImage()
  }
})

onBeforeUnmount(() => {
  cleanupStageFn?.()
  cleanupStageFn = null
  triggerBounceFn = null
  downloadPngFn = null
})
</script>

<template>
  <section id="mixer" class="py-20 sm:py-28 lg:py-32 bg-off-white border-y border-line">
    <div class="swiss-container">
      <!-- Numbered Swiss Section Header -->
      <div v-reveal class="mb-14 sm:mb-16">
        <div class="swiss-section-rule mb-5"></div>
        <div class="swiss-grid gap-y-6 items-end">
          <div class="col-span-4 lg:col-span-2">
            <span class="swiss-mono text-signal">02 / MIXER</span>
          </div>
          <div class="col-span-4 lg:col-span-6">
            <h2 class="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[0.98] text-black text-left">
              Konfigurator Kemasan &amp; Brand Kit 3D.
            </h2>
          </div>
          <div class="col-span-4 lg:col-span-4">
            <p class="text-sm sm:text-base text-dark-gray leading-relaxed text-left">
              Uji 10 jenis kemasan realistis, atur tipografi label, material, dan warna siklorama studio, lalu unduh foto PNG resolusi 2x atau pesan via WhatsApp.
            </p>
          </div>
        </div>
      </div>

      <!-- 12-Col Grid: Left 4-Col Numbered Control List + Right 8-Col 1px Viewport -->
      <div class="swiss-grid gap-y-10 items-start">
        <!-- LEFT 4-COL CONTROL COLUMN: Plain Numbered List Separated by 1px Rules -->
        <div v-reveal="60" class="col-span-4 lg:col-span-4 border-t border-black">
          <!-- 01 Nama -->
          <div class="py-5 border-b border-line">
            <div class="flex items-center justify-between mb-2">
              <label for="mixer-brand-name" class="swiss-mono text-black">
                01 / NAMA
              </label>
              <span class="swiss-mono text-dark-gray">{{ brandName.length }}/18</span>
            </div>
            <input
              id="mixer-brand-name"
              :value="brandName"
              type="text"
              maxlength="18"
              placeholder="KOPI SENJA"
              class="w-full px-0 py-2 bg-transparent border-0 border-b border-black rounded-none font-display text-xl sm:text-2xl font-medium tracking-[-0.025em] text-black placeholder:text-mid-gray focus:border-signal focus:outline-none transition-colors duration-300"
              @input="onBrandInputChange"
            />
          </div>

          <!-- 02 Produk: 2-Col List of Names with Tiny Index Numbers (No Icons or Cards) -->
          <fieldset class="py-5 border-b border-line">
            <legend class="swiss-mono text-black mb-3 w-full flex items-center justify-between">
              <span>02 / PRODUK</span>
              <span class="text-dark-gray">{{ selectedProductMeta.name }}</span>
            </legend>
            <div class="grid grid-cols-2 gap-x-5">
              <button
                v-for="(prod, idx) in PRODUCT_CATALOG"
                :key="prod.id"
                type="button"
                :aria-pressed="productId === prod.id ? 'true' : 'false'"
                class="py-2 border-b flex items-baseline gap-2 text-left transition-colors duration-300 ease-out"
                :class="
                  productId === prod.id
                    ? 'border-b-2 border-signal text-black font-medium'
                    : 'border-line text-dark-gray hover:text-black'
                "
                @click="productId = prod.id"
              >
                <span
                  class="swiss-mono shrink-0"
                  :class="productId === prod.id ? 'text-signal' : 'text-mid-gray'"
                >
                  {{ String(idx + 1).padStart(2, '0') }}
                </span>
                <span class="text-xs sm:text-sm tracking-[-0.01em] truncate">{{ prod.name }}</span>
              </button>
            </div>
          </fieldset>

          <!-- 03 Gaya: Text-Only Segmented Control with Red Active Underline -->
          <fieldset class="py-5 border-b border-line">
            <legend class="swiss-mono text-black mb-3 w-full flex items-center justify-between">
              <span>03 / GAYA</span>
              <span class="text-dark-gray">{{ vibe }}</span>
            </legend>
            <div class="grid grid-cols-4 border-b border-line">
              <button
                v-for="v in VIBE_LIST"
                :key="v.id"
                type="button"
                :aria-pressed="vibe === v.id ? 'true' : 'false'"
                class="py-2 -mb-px text-left text-xs sm:text-sm tracking-[-0.01em] border-b-2 transition-colors duration-300 ease-out"
                :class="
                  vibe === v.id
                    ? 'border-signal text-black font-medium'
                    : 'border-transparent text-dark-gray hover:text-black'
                "
                @click="vibe = v.id"
              >
                {{ v.id }}
              </button>
            </div>
          </fieldset>

          <!-- 04 Warna: Plain Circle Swatches -->
          <fieldset class="py-5 border-b border-line">
            <legend class="swiss-mono text-black mb-3 w-full flex items-center justify-between">
              <span>04 / WARNA</span>
              <span class="text-dark-gray">{{ selectedColorMeta.name }}</span>
            </legend>
            <div class="flex flex-wrap items-center gap-3">
              <button
                v-for="sw in BRAND_SWATCHES"
                :key="sw.hex"
                type="button"
                :aria-label="`Pilih warna brand ${sw.name}`"
                :aria-pressed="colorHex.toLowerCase() === sw.hex.toLowerCase() ? 'true' : 'false'"
                class="w-7 h-7 rounded-full border border-black/15 transition-transform duration-300 ease-out"
                :class="
                  colorHex.toLowerCase() === sw.hex.toLowerCase()
                    ? 'ring-2 ring-signal ring-offset-2 ring-offset-off-white scale-110'
                    : 'hover:scale-110'
                "
                :style="{ backgroundColor: sw.hex }"
                @click="colorHex = sw.hex"
              ></button>
            </div>
          </fieldset>

          <!-- 05 Finishing: Text-Only Segmented Control with Red Active Underline -->
          <fieldset class="py-5 border-b border-line">
            <legend class="swiss-mono text-black mb-3 w-full flex items-center justify-between">
              <span>05 / FINISHING</span>
              <span class="text-dark-gray">{{ finish }}</span>
            </legend>
            <div class="grid grid-cols-3 border-b border-line">
              <button
                v-for="f in FINISH_LIST"
                :key="f.id"
                type="button"
                :aria-pressed="finish === f.id ? 'true' : 'false'"
                class="py-2 -mb-px text-left text-xs sm:text-sm tracking-[-0.01em] border-b-2 transition-colors duration-300 ease-out"
                :class="
                  finish === f.id
                    ? 'border-signal text-black font-medium'
                    : 'border-transparent text-dark-gray hover:text-black'
                "
                @click="finish = f.id"
              >
                {{ f.label }}
              </button>
            </div>
          </fieldset>

          <!-- 06 Latar: Plain Circle Cyclorama Swatches -->
          <fieldset class="py-5 border-b border-line">
            <legend class="swiss-mono text-black mb-3 w-full flex items-center justify-between">
              <span>06 / LATAR</span>
              <span class="text-dark-gray">{{ selectedBackdropMeta.name }}</span>
            </legend>
            <div class="flex flex-wrap items-center gap-3">
              <button
                v-for="bg in BACKDROP_PRESETS"
                :key="bg.id"
                type="button"
                :aria-label="`Latar studio ${bg.name}`"
                :aria-pressed="backdropId === bg.id ? 'true' : 'false'"
                class="w-7 h-7 rounded-full border border-black/15 transition-transform duration-300 ease-out"
                :class="
                  backdropId === bg.id
                    ? 'ring-2 ring-signal ring-offset-2 ring-offset-off-white scale-110'
                    : 'hover:scale-110'
                "
                :style="{ backgroundColor: bg.hex }"
                @click="backdropId = bg.id"
              ></button>
            </div>
          </fieldset>

          <!-- WhatsApp Deep-Link CTA -->
          <div class="pt-6">
            <a
              :href="waDeepLink"
              target="_blank"
              rel="noopener noreferrer"
              class="group w-full swiss-btn-primary px-6 py-4 text-sm sm:text-base"
            >
              <span>Pesan Desain Ini via WhatsApp</span>
              <span class="swiss-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <!-- RIGHT 8-COL VIEWPORT: Sharp 1px Border + Mono Caption Bar -->
        <div
          v-reveal="120"
          class="col-span-4 lg:col-span-8 border border-black bg-white rounded-none flex flex-col"
        >
          <!-- Top Mono Caption Bar + Text Segmented Mode Toggle -->
          <div class="px-4 sm:px-5 border-b border-line bg-white flex flex-wrap items-center justify-between gap-3">
            <div class="py-3 swiss-mono text-black flex flex-wrap items-center gap-2.5">
              <span class="text-signal font-semibold">{{ selectedProductIndexLabel }}</span>
              <span class="text-line" aria-hidden="true">/</span>
              <span>{{ selectedProductMeta.name }}</span>
              <span class="text-line" aria-hidden="true">/</span>
              <span class="text-dark-gray">{{ vibe }} · {{ finish }}</span>
            </div>

            <div class="flex items-center gap-5" role="group" aria-label="Mode tampilan studio">
              <button
                type="button"
                :aria-pressed="viewportMode === 'single' ? 'true' : 'false'"
                class="py-3 -mb-px swiss-mono border-b-2 transition-colors duration-300 ease-out"
                :class="
                  viewportMode === 'single'
                    ? 'border-signal text-black font-semibold'
                    : 'border-transparent text-dark-gray hover:text-black'
                "
                @click="viewportMode = 'single'"
              >
                Satu Produk
              </button>
              <button
                type="button"
                :aria-pressed="viewportMode === 'kit' ? 'true' : 'false'"
                class="py-3 -mb-px swiss-mono border-b-2 transition-colors duration-300 ease-out"
                :class="
                  viewportMode === 'kit'
                    ? 'border-signal text-black font-semibold'
                    : 'border-transparent text-dark-gray hover:text-black'
                "
                @click="viewportMode = 'kit'"
              >
                Brand Kit (10)
              </button>
            </div>
          </div>

          <!-- Photoreal Studio Viewport Stage (Reserved Height for Zero CLS) -->
          <div class="relative w-full h-[420px] sm:h-[540px] lg:h-[620px] bg-off-white overflow-hidden select-none">
            <!-- Fallback 2D Label View when WebGL is Unavailable -->
            <div
              v-if="webglUnavailable"
              class="w-full h-full flex flex-col items-center justify-center p-6 gap-4"
              :style="{ backgroundColor: selectedBackdropMeta.hex }"
            >
              <img
                v-if="fallbackLabelDataUrl"
                :src="fallbackLabelDataUrl"
                :alt="`Desain label 2D untuk merek ${displayBrand}`"
                class="max-h-72 w-auto border border-black bg-white object-contain"
              />
              <p class="px-4 py-2.5 bg-white border border-black swiss-mono text-black max-w-md text-left leading-relaxed">
                WEBGL TIDAK TERSEDIA — MENAMPILKAN PRATINJAU LABEL CETAK 2D LANGSUNG.
              </p>
            </div>

            <!-- Interactive Three.js Stage -->
            <div
              v-else
              ref="stageContainerRef"
              data-cursor-grow
              class="w-full h-full"
              :class="isHoveringMesh ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'"
            ></div>

            <!-- Snapshot Flash -->
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 bg-white z-20 transition-opacity duration-300 ease-out"
              :class="snapshotFlash ? 'opacity-85' : 'opacity-0'"
            ></div>
          </div>

          <!-- Bottom Mono Action Bar -->
          <div class="px-4 sm:px-5 py-3 border-t border-line bg-white flex flex-wrap items-center justify-between gap-3">
            <span class="swiss-mono text-dark-gray">
              <template v-if="viewportMode === 'kit'">
                KLIK PRODUK DI LANTAI STUDIO UNTUK FOKUS KAMERA
              </template>
              <template v-else>
                GESER UNTUK MEMUTAR · ZOOM DIKUNCI AGAR NYAMAN DI-SCROLL
              </template>
            </span>

            <div class="flex flex-wrap items-center gap-2">
              <button
                v-if="!webglUnavailable"
                type="button"
                class="px-3.5 py-2 rounded-none border border-black bg-white text-black swiss-mono hover:bg-black hover:text-white transition-colors duration-300 ease-out"
                @click="handleBounceClick"
              >
                Pantulkan
              </button>
              <button
                type="button"
                class="px-3.5 py-2 rounded-none border border-black bg-white text-black swiss-mono hover:bg-black hover:text-white transition-colors duration-300 ease-out"
                @click="handleRandomizeClick"
              >
                Acak!
              </button>
              <button
                v-if="!webglUnavailable"
                type="button"
                class="group px-4 py-2 rounded-none border border-black bg-black text-white swiss-mono hover:bg-signal hover:border-signal transition-colors duration-300 ease-out inline-flex items-center gap-1.5"
                @click="handleDownloadPng"
              >
                <span>Unduh PNG</span>
                <span class="swiss-arrow" aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
