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
  type VibeType,
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

// Mini 2D preview canvases for the 4 Vibe cards
const vibeCanvasMap = new Map<VibeType, HTMLCanvasElement>()
function setVibeCanvasRef(v: VibeType, el: unknown) {
  if (el instanceof HTMLCanvasElement) {
    vibeCanvasMap.set(v, el)
  } else {
    vibeCanvasMap.delete(v)
  }
}

const displayBrand = computed(() => (brandName.value.trim() || 'KOPI SENJA').slice(0, 18).toUpperCase())
const selectedProductMeta = computed(
  () => PRODUCT_CATALOG.find((p) => p.id === productId.value) || PRODUCT_CATALOG[0]
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

async function refreshMiniVibePreviews() {
  if (typeof document === 'undefined') return
  const b = displayBrand.value
  const c = colorHex.value
  await Promise.all(
    VIBE_LIST.map(async (item) => {
      const targetCanvas = vibeCanvasMap.get(item.id)
      if (!targetCanvas) return
      const rendered = await drawLabel(b, item.id, c, 'front', 0.22)
      const ctx = targetCanvas.getContext('2d')
      if (!ctx) return
      targetCanvas.width = 140
      targetCanvas.height = 96
      // Crop center band of the label so brand & colors are crisp at thumbnail size
      ctx.drawImage(rendered, 0, rendered.height * 0.16, rendered.width, rendered.height * 0.68, 0, 0, 140, 96)
    })
  )
}

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

// Inline SVG path helper for each of the 10 product picker cards
const productSvgIcons: Record<ProductId, string> = {
  pouch: 'M6 4h12l1 15c0 1-2.5 1.5-7 1.5S5 20 5 19L6 4zm1 3.5h10M9 11h6',
  box: 'M5 6l7-3 7 3v12l-7 3-7-3V6zm0 0l7 3 7-3m-7 3v12',
  can: 'M8 4h8l1 2v12l-1 2H8l-1-2V6l1-2zm-1 3h10M7 17h10',
  cup: 'M6 7h12l-1.5 13h-9L6 7zm-1 0h14M8 7c1-3 7-3 8 0m-3-5l-1 5',
  bottle: 'M10 3h4v3l2.5 3.5V19a1.5 1.5 0 01-1.5 1.5H9A1.5 1.5 0 017.5 19V9.5L10 6V3zm-2.5 9h9',
  jar: 'M7 5h10v2.5H7V5zm1 2.5h8l1 2v9.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 017 19V9.5l1-2zm-1 4.5h10',
  tote: 'M6 9h12l1 11H5L6 9zm3 0V6a3 3 0 016 0v3',
  paperbag: 'M6 8h12l1 12H5L6 8zm3 0V6a3 3 0 016 0v2m-9 2.5h12',
  card: 'M4 8h13v9H4V8zm3-2h13v9',
  sticker: 'M5 5h14v11l-3 3H5V5zm11 14v-3h3M9.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm5 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z'
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
  refreshMiniVibePreviews()

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

  // Longer studio lens framing
  camera.position.set(0, 1.48, 4.55)
  const controls = new OrbitMod.OrbitControls(camera, canvas)
  controls.target.set(0, 0.72, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.065
  controls.autoRotate = !prefersReduced
  controls.autoRotateSpeed = 1.35
  controls.enableZoom = false
  controls.enablePan = false
  controls.minPolarAngle = Math.PI * 0.18
  controls.maxPolarAngle = Math.PI * 0.475 // Never goes under the studio floor
  controls.update()

  // Shared 4 layout textures so Brand Kit (all 10 products) & keystrokes are ultra-fast
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

  // ---- SINGLE PRODUCT STAGE STATE ----
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

  // ---- BRAND KIT (ALL 10 PRODUCTS) STAGE STATE ----
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

  // Two staggered studio rows of 5 products
  const kitPositions: [number, number, number][] = [
    // Back row (taller containers)
    [-3.1, -0.78, 0.14],
    [-1.55, -0.86, 0.08],
    [0.0, -0.92, 0.0],
    [1.55, -0.86, -0.08],
    [3.1, -0.78, -0.14],
    // Front row (staggered)
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
    // Note: across all 10 products, ONLY bottle & jar use glass (2 glass meshes total <= max 2!)
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

  // Smooth camera flight lerp state (0.6s eased lerp)
  const camFlight = {
    active: false,
    elapsed: 0,
    duration: 0.6,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3()
  }

  function flyCameraTo(toPos: import('three').Vector3, toTarget: import('three').Vector3, duration = 0.6) {
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
    flyCameraTo(offsetPos, entry.focusTarget, 0.6)
  }

  // Initial spawn
  spawnSingleProduct(productId.value, false)

  // Reactive state watchers
  let brandTimer: ReturnType<typeof setTimeout> | null = null
  const stopBrandWatch = watch(brandName, () => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    if (brandTimer) clearTimeout(brandTimer)
    brandTimer = setTimeout(async () => {
      await Promise.all([updateAllLabelTextures(), refreshMiniVibePreviews()])
    }, 150)
  })

  const stopVibeWatch = watch(vibe, async () => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    await updateAllLabelTextures()
  })

  const stopColorFinishWatch = watch([colorHex, finish], async () => {
    canvas.setAttribute('aria-label', canvasAriaLabel.value)
    await Promise.all([updateAllLabelTextures(), refreshMiniVibePreviews()])
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
      flyCameraTo(new THREE.Vector3(0, 3.15, 9.2), new THREE.Vector3(0, 0.55, 0.1), 0.6)
    } else {
      brandKitGroup.visible = false
      clearBrandKit()
      singleStageGroup.visible = true
      spawnSingleProduct(productId.value, false)
      controls.autoRotate = !prefersReduced
      flyCameraTo(new THREE.Vector3(0, 1.48, 4.55), new THREE.Vector3(0, 0.72, 0), 0.55)
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

  // Raycast hover cursor + click bounce / Brand Kit selection & camera fly
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

  // Render loop + IntersectionObserver + ResizeObserver
  let rafId = 0
  let running = false
  let inView = true
  let prevNow = performance.now()

  const tick = (now: number) => {
    if (!running) return
    const dt = Math.min((now - prevNow) / 1000, 0.05)
    prevNow = now

    // Camera flight interpolation (0.6s eased lerp)
    if (camFlight.active) {
      camFlight.elapsed += dt
      const t = Math.min(1, camFlight.elapsed / camFlight.duration)
      const e = easeOutCubic(t)
      camera.position.lerpVectors(camFlight.fromPos, camFlight.toPos, e)
      controls.target.lerpVectors(camFlight.fromTarget, camFlight.toTarget, e)
      if (t >= 1) camFlight.active = false
    }

    // Single product swap transition (0.35s ease-out-back) & subtle 0.08 bounce
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
        const dur = 0.45
        if (bounceTimer >= dur) {
          bounceTimer = -1
        } else {
          const p = bounceTimer / dur
          const decay = Math.exp(-4.5 * p)
          const wave = Math.sin(p * Math.PI * 3.0)
          // Subtle realistic studio bounce (0.08 amplitude)
          sy *= 1 + wave * decay * 0.08
          sx *= 1 - wave * decay * 0.045
          sz *= 1 - wave * decay * 0.045
          by = Math.abs(wave) * decay * 0.06
        }
      }

      activeSingle.holder.scale.set(sx, sy, sz)
      activeSingle.holder.position.y = by
    }

    // Outgoing product scale down + fade out + full dispose after 0.25s
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

    // Brand Kit item bounces
    if (viewportMode.value === 'kit') {
      for (const entry of kitEntries) {
        if (entry.bounceTime >= 0) {
          entry.bounceTime += dt
          const dur = 0.45
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

// Keep 2D fallback reactive if WebGL is unavailable
watch([brandName, vibe, colorHex, productId], () => {
  if (webglUnavailable.value) {
    refreshFallback2DImage()
    refreshMiniVibePreviews()
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
  <section id="mixer" class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper-dark/60">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span class="brutal-tag bg-indigo text-paper mb-3">STUDIO FOTO KEMASAN // LAB 02</span>
          <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Konfigurator Produk &amp; Brand Kit 3D
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-ink/80">
          Uji 10 jenis kemasan produk realistis, pilih tekstur bahan dan warna siklorama studio, lalu unduh foto PNG 2x atau kirim spesifikasinya ke WhatsApp.
        </p>
      </div>

      <!-- Left Controls (5 cols) + Right Photoreal Studio Viewport (7 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT CONTROLS (5 cols) -->
        <div v-reveal="80" class="lg:col-span-5 brutal-card p-5 sm:p-6 flex flex-col gap-5">
          <!-- 1. Brand Name -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="mixer-brand-name" class="font-mono text-xs font-bold uppercase tracking-wider">
                1. Nama Brand
              </label>
              <span class="font-mono text-xs text-ink/70">{{ brandName.length }}/18</span>
            </div>
            <input
              id="mixer-brand-name"
              :value="brandName"
              type="text"
              maxlength="18"
              placeholder="KOPI SENJA"
              class="w-full px-3.5 py-2.5 bg-white border-2 border-ink font-display font-bold text-base shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-indigo"
              @input="onBrandInputChange"
            />
          </div>

          <!-- 2. Product Picker (10 Cards with Inline SVG Icons) -->
          <fieldset>
            <legend class="font-mono text-xs font-bold uppercase tracking-wider mb-2">
              2. Pilih Kemasan (10 Produk): <span class="text-indigo">{{ selectedProductMeta.name }}</span>
            </legend>
            <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5 gap-2">
              <button
                v-for="prod in PRODUCT_CATALOG"
                :key="prod.id"
                type="button"
                :aria-pressed="productId === prod.id ? 'true' : 'false'"
                class="p-2 border-2 border-ink flex flex-col items-center justify-center gap-1 text-center transition-all"
                :class="
                  productId === prod.id
                    ? 'bg-yellow shadow-brutal-sm -translate-y-0.5'
                    : 'bg-paper hover:bg-paper-dark'
                "
                @click="productId = prod.id"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path :d="productSvgIcons[prod.id]" />
                </svg>
                <span class="font-mono text-[10px] font-bold leading-tight">{{ prod.shortName }}</span>
              </button>
            </div>
          </fieldset>

          <!-- 3. Vibe (4 Cards with Tiny Live Label Preview on Mini Canvas) -->
          <fieldset>
            <legend class="font-mono text-xs font-bold uppercase tracking-wider mb-2">
              3. Gaya Label: <span class="text-indigo">{{ vibe }}</span>
            </legend>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                v-for="v in VIBE_LIST"
                :key="v.id"
                type="button"
                :aria-pressed="vibe === v.id ? 'true' : 'false'"
                class="p-2 border-2 border-ink text-left transition-all flex flex-col gap-1.5"
                :class="
                  vibe === v.id
                    ? 'bg-cyan shadow-brutal-sm -translate-y-0.5'
                    : 'bg-paper hover:bg-paper-dark'
                "
                @click="vibe = v.id"
              >
                <canvas
                  :ref="(el) => setVibeCanvasRef(v.id, el)"
                  width="140"
                  height="96"
                  class="w-full h-12 border border-ink/40 bg-white object-cover"
                  aria-hidden="true"
                ></canvas>
                <div class="flex items-center justify-between w-full">
                  <span class="font-display font-bold text-xs">{{ v.id }}</span>
                  <span class="font-mono text-[10px] text-ink/70">{{ v.desc.split(',')[0] }}</span>
                </div>
              </button>
            </div>
          </fieldset>

          <!-- 4. Color Swatches (6) & 5. Finish Segmented Control -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset>
              <legend class="font-mono text-xs font-bold uppercase tracking-wider mb-2">
                4. Warna Brand
              </legend>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="sw in BRAND_SWATCHES"
                  :key="sw.hex"
                  type="button"
                  :aria-label="`Pilih warna brand ${sw.name}`"
                  :aria-pressed="colorHex.toLowerCase() === sw.hex.toLowerCase() ? 'true' : 'false'"
                  class="w-8 h-8 border-2 border-ink flex items-center justify-center transition-transform"
                  :class="
                    colorHex.toLowerCase() === sw.hex.toLowerCase()
                      ? 'scale-110 ring-2 ring-indigo ring-offset-1 ring-offset-paper shadow-brutal-sm'
                      : 'hover:scale-105'
                  "
                  :style="{ backgroundColor: sw.hex }"
                  @click="colorHex = sw.hex"
                >
                  <span
                    v-if="colorHex.toLowerCase() === sw.hex.toLowerCase()"
                    class="font-mono text-[10px] font-bold"
                    :class="sw.hex === '#FFD84D' || sw.hex === '#22E6D0' ? 'text-ink' : 'text-paper'"
                    aria-hidden="true"
                  >✓</span>
                </button>
              </div>
            </fieldset>

            <fieldset>
              <legend class="font-mono text-xs font-bold uppercase tracking-wider mb-2">
                5. Finish Material
              </legend>
              <div class="grid grid-cols-3 border-2 border-ink bg-paper shadow-brutal-sm">
                <button
                  v-for="f in FINISH_LIST"
                  :key="f.id"
                  type="button"
                  :aria-pressed="finish === f.id ? 'true' : 'false'"
                  class="py-2 px-1 font-mono text-[11px] font-bold border-r-2 last:border-r-0 border-ink transition-colors"
                  :class="finish === f.id ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-yellow'"
                  @click="finish = f.id"
                >
                  {{ f.label }}
                </button>
              </div>
            </fieldset>
          </div>

          <!-- 6. Cyclorama Backdrop Presets (6 Swatches) -->
          <fieldset>
            <legend class="font-mono text-xs font-bold uppercase tracking-wider mb-2">
              6. Latar Siklorama Studio: <span class="text-indigo">{{ selectedBackdropMeta.name }}</span>
            </legend>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="bg in BACKDROP_PRESETS"
                :key="bg.id"
                type="button"
                :aria-label="`Latar studio ${bg.name}`"
                :aria-pressed="backdropId === bg.id ? 'true' : 'false'"
                class="h-9 border-2 border-ink flex items-center justify-center transition-transform"
                :class="
                  backdropId === bg.id
                    ? 'scale-105 ring-2 ring-indigo ring-offset-1 ring-offset-paper shadow-brutal-sm'
                    : 'hover:scale-105'
                "
                :style="{ backgroundColor: bg.hex }"
                @click="backdropId = bg.id"
              >
                <span
                  v-if="backdropId === bg.id"
                  class="font-mono text-xs font-bold"
                  :class="bg.isDark ? 'text-paper' : 'text-ink'"
                  aria-hidden="true"
                >✓</span>
              </button>
            </div>
          </fieldset>

          <!-- WhatsApp Deep-Link CTA -->
          <div class="pt-3 border-t-2 border-ink">
            <a
              :href="waDeepLink"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full brutal-btn bg-coral text-ink px-5 py-3.5 text-sm sm:text-base text-center"
            >
              <span>Pesan Desain Ini via WhatsApp</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <!-- RIGHT VIEWPORT (7 cols) -->
        <div v-reveal="140" class="lg:col-span-7 brutal-card overflow-hidden flex flex-col">
          <!-- Ink Top Bar: Product Name + Vibe + Mode Toggle ("Satu Produk" / "Brand Kit") -->
          <div class="px-4 py-2.5 bg-ink text-paper flex flex-wrap items-center justify-between gap-3">
            <div class="font-mono text-xs uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan" aria-hidden="true"></span>
              <span>{{ selectedProductMeta.name }} · {{ vibe }} · {{ finish }}</span>
            </div>

            <div class="inline-flex border-2 border-paper bg-ink" role="group" aria-label="Mode tampilan studio">
              <button
                type="button"
                :aria-pressed="viewportMode === 'single' ? 'true' : 'false'"
                class="px-3 py-1 font-mono text-xs font-bold transition-colors"
                :class="viewportMode === 'single' ? 'bg-yellow text-ink' : 'text-paper hover:bg-paper/15'"
                @click="viewportMode = 'single'"
              >
                Satu Produk
              </button>
              <button
                type="button"
                :aria-pressed="viewportMode === 'kit' ? 'true' : 'false'"
                class="px-3 py-1 font-mono text-xs font-bold border-l-2 border-paper transition-colors"
                :class="viewportMode === 'kit' ? 'bg-cyan text-ink' : 'text-paper hover:bg-paper/15'"
                @click="viewportMode = 'kit'"
              >
                Brand Kit (10)
              </button>
            </div>
          </div>

          <!-- Photoreal Studio Viewport Stage (Reserved Height to Avoid CLS) -->
          <div class="relative w-full h-[420px] sm:h-[520px] lg:h-[580px] bg-[#EAE5DC] overflow-hidden select-none">
            <!-- Fallback 2D Label View when WebGL is Unavailable -->
            <div
              v-if="webglUnavailable"
              class="w-full h-full flex flex-col items-center justify-center p-6 gap-4 text-center"
              :style="{ backgroundColor: selectedBackdropMeta.hex }"
            >
              <img
                v-if="fallbackLabelDataUrl"
                :src="fallbackLabelDataUrl"
                :alt="`Desain label 2D untuk merek ${displayBrand}`"
                class="max-h-72 w-auto border-2 border-ink shadow-brutal bg-white object-contain"
              />
              <p
                class="px-4 py-2 bg-paper border-2 border-ink font-mono text-xs font-semibold max-w-md shadow-brutal-sm text-ink"
              >
                Perangkat ini tidak mendukung WebGL 3D. Menampilkan pratinjau label cetak 2D langsung — seluruh pengaturan tetap berfungsi penuh.
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

            <!-- Subtle Studio Vignette Overlay (CSS Only) -->
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 shadow-[inset_0_0_85px_rgba(11,11,15,0.15)]"
            ></div>

            <!-- Snapshot Flash -->
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 bg-white z-20 transition-opacity duration-300"
              :class="snapshotFlash ? 'opacity-85' : 'opacity-0'"
            ></div>
          </div>

          <!-- Neo-Brutalist Bottom Action Bar -->
          <div class="p-3.5 sm:px-5 border-t-2 border-ink bg-paper flex flex-wrap items-center justify-between gap-3">
            <span class="font-mono text-xs text-ink/80">
              <template v-if="viewportMode === 'kit'">
                Klik produk mana saja di lantai studio untuk mendekatkan kamera
              </template>
              <template v-else>
                Geser untuk memutar produk · Zoom dikunci agar nyaman di-scroll
              </template>
            </span>

            <div class="flex flex-wrap items-center gap-2">
              <button
                v-if="!webglUnavailable"
                type="button"
                class="px-3 py-1.5 bg-paper hover:bg-yellow border-2 border-ink font-mono text-xs font-bold shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                @click="handleBounceClick"
              >
                Pantulkan!
              </button>
              <button
                type="button"
                class="px-3 py-1.5 bg-cyan hover:bg-yellow border-2 border-ink font-mono text-xs font-bold shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                @click="handleRandomizeClick"
              >
                🎲 Acak!
              </button>
              <button
                v-if="!webglUnavailable"
                type="button"
                class="px-3.5 py-1.5 bg-yellow hover:bg-coral border-2 border-ink font-mono text-xs font-bold shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                @click="handleDownloadPng"
              >
                ⬇ Unduh PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
