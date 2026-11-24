<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'

const stageWrapRef = ref<HTMLElement | null>(null)
const canvasMountRef = ref<HTMLElement | null>(null)

// Static fallback mode when WebGL is unavailable OR prefers-reduced-motion is enabled
const staticFallback = ref(false)
const sceneReady = ref(false)
const isHoveringObject = ref(false)
const isDraggingScene = ref(false)

const hoveredCaption = reactive({
  visible: false,
  text: '',
  x: 0,
  y: 0
})

let cleanupScene: (() => void) | null = null
let cycleAllColorsFn: (() => void) | null = null

function handleCycleColorsButton() {
  cycleAllColorsFn?.()
}

function checkWebGLSupport(): boolean {
  try {
    const testCanvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion || !checkWebGLSupport()) {
    staticFallback.value = true
    return
  }

  let THREE: typeof import('three')
  try {
    ;[THREE] = await Promise.all([import('three'), nextTick()])
  } catch {
    staticFallback.value = true
    return
  }

  const mountEl = canvasMountRef.value
  const stageEl = stageWrapRef.value
  if (!mountEl || !stageEl) return

  let renderer: import('three').WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
  } catch {
    staticFallback.value = true
    return
  }

  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const getBounds = () => ({
    width: Math.max(stageEl.clientWidth, 280),
    height: Math.max(stageEl.clientHeight, 320)
  })

  const initialBounds = getBounds()
  renderer.setSize(initialBounds.width, initialBounds.height)

  // Accessible canvas attributes + touch-action: pan-y so vertical scroll is never hijacked
  const canvas = renderer.domElement
  canvas.setAttribute('role', 'img')
  canvas.setAttribute(
    'aria-label',
    'Meja kerja 3D interaktif Arc Lab menampilkan logo busur, kemasan kotak, kaleng, cangkir, dan palet warna desain'
  )
  canvas.style.touchAction = 'pan-y'
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  mountEl.appendChild(canvas)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, initialBounds.width / initialBounds.height, 0.1, 50)
  camera.position.set(0, 2.55, 7.65)
  camera.lookAt(0, 0.15, 0)

  // Hard Cell-Shading Lighting (single directional light + soft base ambient so shadows stay readable)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.05)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.55)
  keyLight.position.set(4.5, 7.5, 5.5)
  scene.add(ambientLight, keyLight)

  // 2-step Toon Gradient Map for crisp flat cell shading
  const toonPixels = new Uint8Array([
    196, 196, 202, 255,
    255, 255, 255, 255
  ])
  const gradientTex = new THREE.DataTexture(toonPixels, 2, 1, THREE.RGBAFormat)
  gradientTex.minFilter = THREE.NearestFilter
  gradientTex.magFilter = THREE.NearestFilter
  gradientTex.generateMipmaps = false
  gradientTex.needsUpdate = true

  // Shared Ink BackSide Material for inverted-hull 2px outlines
  const inkOutlineMat = new THREE.MeshBasicMaterial({
    color: 0x0b0b0f,
    side: THREE.BackSide
  })
  const inkFlatMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0f })
  const paperDeskMat = new THREE.MeshToonMaterial({
    color: 0xeae5d9,
    gradientMap: gradientTex
  })

  const disposables: { geometries: import('three').BufferGeometry[]; materials: import('three').Material[] } = {
    geometries: [],
    materials: [inkOutlineMat, inkFlatMat, paperDeskMat]
  }

  /**
   * Builds a watertight single-Mesh inverted-hull outlined geometry:
   * Group 0 = main toon surface, Group 1 = normal-extruded BackSide #0B0B0F ink outline.
   * Keeps total scene mesh count strictly < 15 while giving crisp 2px ink borders!
   */
  function buildOutlinedGeometry(
    srcGeo: import('three').BufferGeometry,
    outlineThickness = 0.042
  ): import('three').BufferGeometry {
    const nonIndexed = srcGeo.index ? srcGeo.toNonIndexed() : srcGeo.clone()
    nonIndexed.computeVertexNormals()

    const outlinePart = nonIndexed.clone()
    const pos = outlinePart.attributes.position as import('three').BufferAttribute
    const norm = outlinePart.attributes.normal as import('three').BufferAttribute

    // Average normals across coincident vertices so sharp box/cylinder corners stay watertight
    const accum = new Map<string, [number, number, number]>()
    for (let i = 0; i < pos.count; i++) {
      const key = `${Math.round(pos.getX(i) * 1000)},${Math.round(pos.getY(i) * 1000)},${Math.round(pos.getZ(i) * 1000)}`
      const cur = accum.get(key) || [0, 0, 0]
      cur[0] += norm.getX(i)
      cur[1] += norm.getY(i)
      cur[2] += norm.getZ(i)
      accum.set(key, cur)
    }

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const key = `${Math.round(x * 1000)},${Math.round(y * 1000)},${Math.round(z * 1000)}`
      const avg = accum.get(key)!
      const len = Math.hypot(avg[0], avg[1], avg[2]) || 1
      pos.setXYZ(
        i,
        x + (avg[0] / len) * outlineThickness,
        y + (avg[1] / len) * outlineThickness,
        z + (avg[2] / len) * outlineThickness
      )
    }

    const vCount = nonIndexed.attributes.position.count
    const mergedPos = new Float32Array(vCount * 2 * 3)
    const mergedNorm = new Float32Array(vCount * 2 * 3)

    mergedPos.set(nonIndexed.attributes.position.array as Float32Array, 0)
    mergedPos.set(outlinePart.attributes.position.array as Float32Array, vCount * 3)

    mergedNorm.set(nonIndexed.attributes.normal.array as Float32Array, 0)
    mergedNorm.set(outlinePart.attributes.normal.array as Float32Array, vCount * 3)

    const combined = new THREE.BufferGeometry()
    combined.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
    combined.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3))
    combined.addGroup(0, vCount, 0)
    combined.addGroup(vCount, vCount, 1)

    srcGeo.dispose()
    nonIndexed.dispose()
    outlinePart.dispose()
    disposables.geometries.push(combined)
    return combined
  }

  // Accent palette cycle: indigo -> cyan -> coral -> yellow
  const ACCENT_HEX = [0x5b5bff, 0x22e6d0, 0xff6b4a, 0xffd84d] as const

  // Root groups for parallax tilt & drag yaw
  const parallaxRoot = new THREE.Group()
  const yawGroup = new THREE.Group()
  parallaxRoot.add(yawGroup)
  scene.add(parallaxRoot)

  // 1 & 2. Desk Disc + Hard Offset Ink Shadow Disc (2 meshes)
  const deskTopGeo = buildOutlinedGeometry(new THREE.CylinderGeometry(3.05, 3.05, 0.12, 36), 0.04)
  const deskTopMesh = new THREE.Mesh(deskTopGeo, [paperDeskMat, inkOutlineMat])
  deskTopMesh.position.set(0, -1.02, 0)

  const deskShadowGeo = new THREE.CylinderGeometry(3.08, 3.08, 0.1, 36)
  disposables.geometries.push(deskShadowGeo)
  const deskShadowMesh = new THREE.Mesh(deskShadowGeo, inkFlatMat)
  deskShadowMesh.position.set(0.16, -1.14, 0.18)

  yawGroup.add(deskShadowMesh, deskTopMesh)

  // 3. Merged Flat Dark Blob Shadows on Desk Surface (1 mesh total for all object shadows)
  function buildMergedBlobShadows(blobs: { x: number; z: number; rx: number; rz: number }[]) {
    const segs = 18
    const vertsPerDisc = segs * 3
    const arr = new Float32Array(blobs.length * vertsPerDisc * 3)
    let offset = 0
    for (const b of blobs) {
      for (let s = 0; s < segs; s++) {
        const a0 = (s / segs) * Math.PI * 2
        const a1 = ((s + 1) / segs) * Math.PI * 2
        // Center
        arr[offset++] = b.x
        arr[offset++] = 0
        arr[offset++] = b.z
        // P1
        arr[offset++] = b.x + Math.cos(a1) * b.rx
        arr[offset++] = 0
        arr[offset++] = b.z + Math.sin(a1) * b.rz
        // P0
        arr[offset++] = b.x + Math.cos(a0) * b.rx
        arr[offset++] = 0
        arr[offset++] = b.z + Math.sin(a0) * b.rz
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    g.computeVertexNormals()
    disposables.geometries.push(g)
    return g
  }

  const blobShadowsMesh = new THREE.Mesh(
    buildMergedBlobShadows([
      { x: 0.08, z: 0.08, rx: 0.72, rz: 0.42 },     // Center Logo
      { x: -1.62, z: 0.28, rx: 0.58, rz: 0.38 },    // Box Package
      { x: 1.66, z: -0.22, rx: 0.48, rz: 0.34 },    // Can
      { x: 1.12, z: 1.18, rx: 0.44, rz: 0.32 },     // Cup
      { x: -1.12, z: 1.28, rx: 0.56, rz: 0.26 },    // Palette Strip
      { x: -1.55, z: -1.05, rx: 0.28, rz: 0.2 },    // Decor Cube
      { x: 1.48, z: -1.25, rx: 0.28, rz: 0.2 }      // Decor Cone
    ]),
    inkFlatMat
  )
  blobShadowsMesh.position.y = -0.955
  yawGroup.add(blobShadowsMesh)

  interface InteractiveDeskItem {
    id: string
    label: string
    group: import('three').Group
    hitMesh: import('three').Mesh
    colorMat: import('three').MeshToonMaterial
    accentIndex: number
    baseY: number
    floatPhase: number
    floatAmp: number
    floatSpeed: number
    currentScale: number
    bounceTime: number
  }

  const interactiveItems: InteractiveDeskItem[] = []
  const raycastTargets: import('three').Object3D[] = []

  function registerItem(opts: {
    id: string
    label: string
    mesh: import('three').Mesh
    extraChildren?: import('three').Object3D[]
    colorMat: import('three').MeshToonMaterial
    accentIndex: number
    pos: [number, number, number]
    rot?: [number, number, number]
    floatPhase: number
    floatAmp?: number
    floatSpeed?: number
  }): InteractiveDeskItem {
    const group = new THREE.Group()
    group.position.set(opts.pos[0], opts.pos[1], opts.pos[2])
    if (opts.rot) group.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2])
    group.add(opts.mesh)
    if (opts.extraChildren) {
      for (const ch of opts.extraChildren) group.add(ch)
    }
    yawGroup.add(group)

    const item: InteractiveDeskItem = {
      id: opts.id,
      label: opts.label,
      group,
      hitMesh: opts.mesh,
      colorMat: opts.colorMat,
      accentIndex: opts.accentIndex,
      baseY: opts.pos[1],
      floatPhase: opts.floatPhase,
      floatAmp: opts.floatAmp ?? 0.08,
      floatSpeed: opts.floatSpeed ?? 1.5,
      currentScale: 1,
      bounceTime: -1
    }
    opts.mesh.userData.deskItem = item
    if (opts.extraChildren) {
      for (const ch of opts.extraChildren) ch.userData.deskItem = item
    }
    interactiveItems.push(item)
    raycastTargets.push(group)
    return item
  }

  function makeToonMat(accentIdx: number) {
    const m = new THREE.MeshToonMaterial({
      color: ACCENT_HEX[accentIdx],
      gradientMap: gradientTex
    })
    disposables.materials.push(m)
    return m
  }

  // 4 & 5. CENTER: 3D Arc Logo Mark (Open Partial Torus Ring + Ink Center Sphere)
  const logoMat = makeToonMat(0) // Indigo #5B5BFF
  const arcRingGeo = buildOutlinedGeometry(
    new THREE.TorusGeometry(0.74, 0.16, 12, 28, Math.PI * 1.52),
    0.042
  )
  const arcRingMesh = new THREE.Mesh(arcRingGeo, [logoMat, inkOutlineMat])
  arcRingMesh.rotation.z = Math.PI * 0.74

  const centerDotMat = new THREE.MeshToonMaterial({ color: 0x0b0b0f, gradientMap: gradientTex })
  disposables.materials.push(centerDotMat)
  const centerDotOutlineMat = new THREE.MeshBasicMaterial({ color: 0xf4f1ea, side: THREE.BackSide })
  disposables.materials.push(centerDotOutlineMat)
  const centerDotGeo = buildOutlinedGeometry(new THREE.SphereGeometry(0.22, 14, 12), 0.035)
  const centerDotMesh = new THREE.Mesh(centerDotGeo, [centerDotMat, centerDotOutlineMat])

  const logoItem = registerItem({
    id: 'logo',
    label: 'LOGO',
    mesh: arcRingMesh,
    extraChildren: [centerDotMesh],
    colorMat: logoMat,
    accentIndex: 0,
    pos: [0, 0.34, 0],
    floatPhase: 0,
    floatAmp: 0.1,
    floatSpeed: 1.4
  })

  // 6. CORAL BOX PACKAGE ("KEMASAN")
  const boxMat = makeToonMat(2) // Coral #FF6B4A
  const boxGeo = buildOutlinedGeometry(new THREE.BoxGeometry(0.84, 1.14, 0.58), 0.042)
  const boxMesh = new THREE.Mesh(boxGeo, [boxMat, inkOutlineMat])
  registerItem({
    id: 'kemasan',
    label: 'KEMASAN',
    mesh: boxMesh,
    colorMat: boxMat,
    accentIndex: 2,
    pos: [-1.68, -0.18, 0.22],
    rot: [0.05, 0.38, -0.04],
    floatPhase: 1.2,
    floatAmp: 0.07,
    floatSpeed: 1.3
  })

  // 7. CYAN CAN ("KALENG")
  const canMat = makeToonMat(1) // Cyan #22E6D0
  const canGeo = buildOutlinedGeometry(new THREE.CylinderGeometry(0.42, 0.42, 1.04, 18), 0.04)
  const canMesh = new THREE.Mesh(canGeo, [canMat, inkOutlineMat])
  registerItem({
    id: 'kaleng',
    label: 'KALENG',
    mesh: canMesh,
    colorMat: canMat,
    accentIndex: 1,
    pos: [1.62, -0.22, -0.26],
    rot: [0.06, -0.35, 0.05],
    floatPhase: 2.4,
    floatAmp: 0.075,
    floatSpeed: 1.45
  })

  // 8. YELLOW CUP ("CANGKIR")
  const cupMat = makeToonMat(3) // Yellow #FFD84D
  const cupGeo = buildOutlinedGeometry(new THREE.CylinderGeometry(0.44, 0.31, 0.88, 18), 0.04)
  const cupMesh = new THREE.Mesh(cupGeo, [cupMat, inkOutlineMat])
  registerItem({
    id: 'cangkir',
    label: 'CANGKIR',
    mesh: cupMesh,
    colorMat: cupMat,
    accentIndex: 3,
    pos: [1.06, -0.32, 1.12],
    rot: [0.04, -0.25, -0.05],
    floatPhase: 3.5,
    floatAmp: 0.065,
    floatSpeed: 1.6
  })

  // 9. FLOATING DECOR 1: Cube ("KUBUS")
  const cubeMat = makeToonMat(0) // Indigo
  const cubeGeo = buildOutlinedGeometry(new THREE.BoxGeometry(0.38, 0.38, 0.38), 0.036)
  const cubeMesh = new THREE.Mesh(cubeGeo, [cubeMat, inkOutlineMat])
  registerItem({
    id: 'kubus',
    label: 'TIPOGRAFI',
    mesh: cubeMesh,
    colorMat: cubeMat,
    accentIndex: 0,
    pos: [-1.52, 0.92, -0.95],
    rot: [0.45, 0.6, 0.25],
    floatPhase: 0.8,
    floatAmp: 0.11,
    floatSpeed: 1.8
  })

  // 10. FLOATING DECOR 2: Cone ("KERUCUT")
  const coneMat = makeToonMat(2) // Coral
  const coneGeo = buildOutlinedGeometry(new THREE.ConeGeometry(0.28, 0.56, 14), 0.036)
  const coneMesh = new THREE.Mesh(coneGeo, [coneMat, inkOutlineMat])
  registerItem({
    id: 'kerucut',
    label: 'ILUSTRASI',
    mesh: coneMesh,
    colorMat: coneMat,
    accentIndex: 2,
    pos: [1.46, 0.98, -1.12],
    rot: [-0.25, 0.3, -0.32],
    floatPhase: 2.1,
    floatAmp: 0.11,
    floatSpeed: 1.7
  })

  // 11. FLOATING DECOR 3: Half-Ring ("BUSUR")
  const halfRingMat = makeToonMat(1) // Cyan
  const halfRingGeo = buildOutlinedGeometry(
    new THREE.TorusGeometry(0.3, 0.09, 10, 16, Math.PI),
    0.034
  )
  const halfRingMesh = new THREE.Mesh(halfRingGeo, [halfRingMat, inkOutlineMat])
  registerItem({
    id: 'busur',
    label: 'ELEMEN',
    mesh: halfRingMesh,
    colorMat: halfRingMat,
    accentIndex: 1,
    pos: [-0.72, 1.25, -0.55],
    rot: [0.2, 0.3, 0.45],
    floatPhase: 4.2,
    floatAmp: 0.09,
    floatSpeed: 1.9
  })

  // 12. ORBITING 4-SWATCH COLOR PALETTE STRIP ("PALET WARNA") — 1 Mesh with CanvasTexture!
  const stripCanvas = document.createElement('canvas')
  stripCanvas.width = 256
  stripCanvas.height = 64
  const sctx = stripCanvas.getContext('2d')
  if (sctx) {
    sctx.fillStyle = '#F4F1EA'
    sctx.fillRect(0, 0, 256, 64)
    const cols = ['#5B5BFF', '#22E6D0', '#FF6B4A', '#FFD84D']
    cols.forEach((c, idx) => {
      sctx.fillStyle = c
      sctx.fillRect(10 + idx * 60, 10, 52, 44)
      sctx.strokeStyle = '#0B0B0F'
      sctx.lineWidth = 4
      sctx.strokeRect(10 + idx * 60, 10, 52, 44)
    })
  }
  const stripTex = new THREE.CanvasTexture(stripCanvas)
  stripTex.colorSpace = THREE.SRGBColorSpace
  const stripMat = new THREE.MeshToonMaterial({
    color: 0xffffff,
    map: stripTex,
    gradientMap: gradientTex
  })
  disposables.materials.push(stripMat)
  const stripGeo = buildOutlinedGeometry(new THREE.BoxGeometry(1.06, 0.08, 0.32), 0.032)
  const stripMesh = new THREE.Mesh(stripGeo, [stripMat, inkOutlineMat])
  const paletteItem = registerItem({
    id: 'palet',
    label: 'PALET WARNA',
    mesh: stripMesh,
    colorMat: stripMat,
    accentIndex: 3,
    pos: [-1.06, -0.68, 1.22],
    rot: [0.12, 0.28, -0.05],
    floatPhase: 5.0,
    floatAmp: 0.05,
    floatSpeed: 1.25
  })
  // Total THREE.Mesh count in scene = 12 (< 15)!

  // Interaction state
  const raycaster = new THREE.Raycaster()
  const pointerNDC = new THREE.Vector2(99, 99)
  let pointerInside = false
  let hoveredItem: InteractiveDeskItem | null = null

  // Parallax targets (max ~12 degrees = 0.21 rad)
  const MAX_TILT = THREE.MathUtils.degToRad(12)
  let targetTiltX = 0
  let targetTiltY = 0

  // Horizontal drag yaw with inertia
  let isPointerDown = false
  let dragMoved = false
  let downClientX = 0
  let downClientY = 0
  let lastDragX = 0
  let yawAngle = 0
  let yawVelocity = 0

  // Central ring 360-degree spin on empty click
  let ringSpinProgress = -1 // -1 = inactive, 0..1 = spinning
  let ringSpinBaseZ = Math.PI * 0.74

  function cycleItemColorAndBounce(item: InteractiveDeskItem) {
    item.bounceTime = 0
    if (item.id === 'palet') return // Keep 4-swatch texture crisp while still bouncing
    item.accentIndex = (item.accentIndex + 1) % ACCENT_HEX.length
    item.colorMat.color.setHex(ACCENT_HEX[item.accentIndex])
  }

  function triggerCentralSpin360() {
    if (ringSpinProgress < 0) {
      ringSpinBaseZ = arcRingMesh.rotation.z
      ringSpinProgress = 0
    }
  }

  // Keyboard-accessible button cycles all object colors + bounces + spins central ring
  cycleAllColorsFn = () => {
    for (const item of interactiveItems) {
      cycleItemColorAndBounce(item)
    }
    triggerCentralSpin360()
  }

  const updatePointerCoords = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1)
    pointerNDC.set(nx, ny)
    targetTiltY = THREE.MathUtils.clamp(nx, -1, 1) * MAX_TILT
    targetTiltX = THREE.MathUtils.clamp(-ny, -1, 1) * MAX_TILT * 0.65
  }

  const projVec = new THREE.Vector3()

  const runHoverRaycast = () => {
    if (!pointerInside || isDraggingScene.value) {
      hoveredItem = null
      isHoveringObject.value = false
      hoveredCaption.visible = false
      return
    }
    raycaster.setFromCamera(pointerNDC, camera)
    const hits = raycaster.intersectObjects(raycastTargets, true)
    const found = hits[0]?.object?.userData?.deskItem as InteractiveDeskItem | undefined
    if (found) {
      hoveredItem = found
      isHoveringObject.value = true
      found.group.getWorldPosition(projVec)
      projVec.y += 0.65
      projVec.project(camera)
      const w = stageEl.clientWidth
      const h = stageEl.clientHeight
      hoveredCaption.text = found.label
      hoveredCaption.x = Math.min(w - 68, Math.max(68, (projVec.x * 0.5 + 0.5) * w))
      hoveredCaption.y = Math.min(h - 36, Math.max(28, (-projVec.y * 0.5 + 0.5) * h))
      hoveredCaption.visible = true
    } else {
      hoveredItem = null
      isHoveringObject.value = false
      hoveredCaption.visible = false
    }
  }

  const onPointerDown = (e: PointerEvent) => {
    isPointerDown = true
    dragMoved = false
    downClientX = e.clientX
    downClientY = e.clientY
    lastDragX = e.clientX
    pointerInside = true
    updatePointerCoords(e.clientX, e.clientY)
  }

  const onPointerMove = (e: PointerEvent) => {
    pointerInside = true
    updatePointerCoords(e.clientX, e.clientY)

    if (isPointerDown) {
      const totalDx = e.clientX - downClientX
      const totalDy = e.clientY - downClientY
      // Respect vertical scroll on touch: only engage horizontal drag if horizontal motion dominates
      if (!dragMoved && Math.hypot(totalDx, totalDy) > 6) {
        if (e.pointerType === 'touch' && Math.abs(totalDy) > Math.abs(totalDx)) {
          isPointerDown = false
          return
        }
        dragMoved = true
        isDraggingScene.value = true
        hoveredCaption.visible = false
      }

      if (dragMoved) {
        const stepDx = e.clientX - lastDragX
        lastDragX = e.clientX
        const deltaYaw = stepDx * 0.0075
        yawAngle += deltaYaw
        yawVelocity = deltaYaw
        return
      }
    }

    if (e.pointerType !== 'touch') {
      runHoverRaycast()
    }
  }

  const onPointerUp = (e: PointerEvent) => {
    const wasTap = isPointerDown && !dragMoved
    isPointerDown = false
    isDraggingScene.value = false

    if (wasTap) {
      updatePointerCoords(e.clientX, e.clientY)
      raycaster.setFromCamera(pointerNDC, camera)
      const hits = raycaster.intersectObjects(raycastTargets, true)
      const hitItem = hits[0]?.object?.userData?.deskItem as InteractiveDeskItem | undefined
      if (hitItem) {
        cycleItemColorAndBounce(hitItem)
      } else {
        triggerCentralSpin360()
      }
    }
  }

  const onPointerLeave = () => {
    pointerInside = false
    isPointerDown = false
    isDraggingScene.value = false
    hoveredItem = null
    isHoveringObject.value = false
    hoveredCaption.visible = false
    targetTiltX = 0
    targetTiltY = 0
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  canvas.addEventListener('pointerleave', onPointerLeave, { passive: true })

  // Render Loop + IntersectionObserver + ResizeObserver + visibilitychange
  let rafId = 0
  let running = false
  let heroInView = true
  let prevNow = performance.now()
  let elapsedClock = 0

  const tick = (now: number) => {
    if (!running) return
    const dt = Math.min((now - prevNow) / 1000, 0.05)
    prevNow = now
    elapsedClock += dt

    // 1. Damped mouse/touch parallax tilt (max ~12 deg)
    parallaxRoot.rotation.x += (targetTiltX - parallaxRoot.rotation.x) * 0.08
    parallaxRoot.rotation.y += (targetTiltY - parallaxRoot.rotation.y) * 0.08

    // 2. Drag yaw + smooth inertia decay
    if (!isDraggingScene.value) {
      yawAngle += yawVelocity
      yawVelocity *= 0.92
      if (Math.abs(yawVelocity) < 0.00005) yawVelocity = 0
    }
    yawGroup.rotation.y = yawAngle

    // 3. Central Arc Logo slow idle rotation + 360-deg empty-area click spin
    logoItem.group.rotation.y = Math.sin(elapsedClock * 0.7) * 0.28
    if (ringSpinProgress >= 0) {
      ringSpinProgress += dt / 0.78
      if (ringSpinProgress >= 1) {
        ringSpinProgress = -1
        arcRingMesh.rotation.z = ringSpinBaseZ
      } else {
        const eased = 1 - Math.pow(1 - ringSpinProgress, 3)
        arcRingMesh.rotation.z = ringSpinBaseZ + eased * Math.PI * 2
      }
    } else {
      arcRingMesh.rotation.z += dt * 0.28
    }

    // Subtle slow orbit for color palette strip
    const orbitAngle = elapsedClock * 0.35
    paletteItem.group.position.x = -1.06 + Math.cos(orbitAngle) * 0.14
    paletteItem.group.position.z = 1.22 + Math.sin(orbitAngle) * 0.1

    // Slow gentle spin on floating decor primitives
    cubeMesh.rotation.x += dt * 0.45
    cubeMesh.rotation.y += dt * 0.55
    coneMesh.rotation.z = Math.sin(elapsedClock * 1.1) * 0.25 - 0.2
    halfRingMesh.rotation.z += dt * 0.4

    // 4. Individual float sine offsets + hover scale (~1.1) + click squash-and-stretch bounce
    for (const item of interactiveItems) {
      item.group.position.y =
        item.baseY + Math.sin(elapsedClock * item.floatSpeed + item.floatPhase) * item.floatAmp

      const targetScale = hoveredItem === item ? 1.11 : 1.0
      item.currentScale += (targetScale - item.currentScale) * 0.14

      let sx = item.currentScale
      let sy = item.currentScale
      let sz = item.currentScale

      if (item.bounceTime >= 0) {
        item.bounceTime += dt
        const dur = 0.52
        if (item.bounceTime >= dur) {
          item.bounceTime = -1
        } else {
          const p = item.bounceTime / dur
          const decay = Math.exp(-4.2 * p)
          const wave = Math.sin(p * Math.PI * 3.0)
          sy *= 1 + wave * decay * 0.28
          sx *= 1 - wave * decay * 0.16
          sz *= 1 - wave * decay * 0.16
          item.group.position.y += Math.abs(wave) * decay * 0.24
        }
      }

      item.group.scale.set(sx, sy, sz)
    }

    // Keep caption anchored smoothly if hovering
    if (hoveredItem && hoveredCaption.visible) {
      hoveredItem.group.getWorldPosition(projVec)
      projVec.y += 0.65
      projVec.project(camera)
      const w = stageEl.clientWidth
      const h = stageEl.clientHeight
      hoveredCaption.x = Math.min(w - 68, Math.max(68, (projVec.x * 0.5 + 0.5) * w))
      hoveredCaption.y = Math.min(h - 36, Math.max(28, (-projVec.y * 0.5 + 0.5) * h))
    }

    renderer.render(scene, camera)
    rafId = window.requestAnimationFrame(tick)
  }

  const startLoop = () => {
    if (!running && heroInView && !document.hidden) {
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
        heroInView = entry.isIntersecting
        if (heroInView) startLoop()
        else stopLoop()
      },
      { threshold: 0.02 }
    )
    io.observe(stageEl)
  }

  let ro: ResizeObserver | null = null
  const handleResize = () => {
    if (!stageWrapRef.value) return
    const { width, height } = getBounds()
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
  }

  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => handleResize())
    ro.observe(stageEl)
  } else {
    window.addEventListener('resize', handleResize)
  }

  const onVisibilityChange = () => {
    if (document.hidden) stopLoop()
    else startLoop()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  sceneReady.value = true
  startLoop()

  cleanupScene = () => {
    stopLoop()
    io?.disconnect()
    ro?.disconnect()
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerLeave)

    for (const g of disposables.geometries) g.dispose()
    for (const m of disposables.materials) m.dispose()
    gradientTex.dispose()
    stripTex.dispose()

    renderer.dispose()
    renderer.forceContextLoss()
    if (canvas.parentNode === mountEl) {
      mountEl.removeChild(canvas)
    }
  }
})

onBeforeUnmount(() => {
  cleanupScene?.()
  cleanupScene = null
  cycleAllColorsFn = null
})
</script>

<template>
  <section id="beranda" class="relative py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 overflow-x-clip">
    <div class="max-w-7xl mx-auto relative">
      <!-- CSS-Only Rotated Sticker Badges Overlapping the Frame Edge -->
      <div
        aria-hidden="true"
        class="hidden sm:inline-flex items-center gap-1.5 absolute -top-4 right-6 lg:right-12 z-20 px-3.5 py-1.5 bg-yellow border-2 border-ink shadow-brutal-sm font-mono text-xs font-bold uppercase -rotate-6 select-none pointer-events-none"
      >
        <span>✦ Gratis konsultasi</span>
      </div>
      <div
        aria-hidden="true"
        class="inline-flex items-center gap-1.5 absolute -top-3.5 left-4 sm:left-8 z-20 px-3 py-1 bg-cyan border-2 border-ink shadow-brutal-sm font-mono text-[11px] font-bold uppercase rotate-3 select-none pointer-events-none"
      >
        <span>MEJA KERJA LAB</span>
      </div>
      <div
        aria-hidden="true"
        class="hidden md:inline-flex items-center gap-1.5 absolute -bottom-4 left-[41%] z-20 px-3.5 py-1.5 bg-coral text-ink border-2 border-ink shadow-brutal-sm font-mono text-xs font-bold uppercase rotate-3 select-none pointer-events-none"
      >
        <span>File Master Lengkap!</span>
      </div>

      <!-- 2-Column Neo-Brutalist Studio Frame (Copy ~45% Left, 3D Scene ~55% Right) -->
      <div class="border-2 border-ink bg-paper shadow-brutal-lg grid grid-cols-1 lg:grid-cols-[45fr_55fr]">
        <!-- LEFT COLUMN: Copy (SSR LCP — renders immediately without waiting for Three.js) -->
        <div class="p-6 sm:p-9 lg:p-11 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-ink bg-paper">
          <div>
            <!-- Mono Label Chip -->
            <div class="mt-2 sm:mt-0 inline-flex items-center gap-2 px-3 py-1 bg-yellow border-2 border-ink shadow-brutal-sm font-mono text-xs font-bold uppercase tracking-wider">
              STUDIO DESAIN UNTUK UMKM
            </div>

            <!-- H1 with Pure-CSS Rotating Highlighted Word -->
            <h1
              class="mt-5 font-display text-4xl sm:text-5xl xl:text-[3.4rem] font-bold tracking-tight leading-[1.08] text-ink"
              :class="{ 'hero-words-static': staticFallback }"
            >
              <!-- Static full sentence for screen readers -->
              <span class="sr-only">
                Desain yang bikin usahamu dilirik, diingat, dan dipercaya.
              </span>

              <span aria-hidden="true" aria-live="off">
                Desain yang bikin usahamu
                <span class="hero-word-rotator mt-1.5">
                  <span class="hero-word-item hero-word-item-0 px-2.5 py-0.5 bg-yellow border-2 border-ink shadow-brutal-sm">
                    dilirik.
                  </span>
                  <span class="hero-word-item hero-word-item-1 px-2.5 py-0.5 bg-cyan border-2 border-ink shadow-brutal-sm">
                    diingat.
                  </span>
                  <span class="hero-word-item hero-word-item-2 px-2.5 py-0.5 bg-coral border-2 border-ink shadow-brutal-sm">
                    dipercaya.
                  </span>
                </span>
              </span>
            </h1>

            <!-- Short Subcopy (1-2 sentences) -->
            <p class="mt-5 text-base sm:text-lg text-ink/85 leading-relaxed max-w-lg">
              Mulai dari logo, kemasan produk siap cetak, hingga konten sosmed yang rapi dengan harga ramah UMKM. Bikin pelanggan yakin sejak pandangan pertama.
            </p>

            <!-- Two CTAs -->
            <div class="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href="#harga"
                class="brutal-btn bg-coral text-ink px-6 py-3.5 text-base"
              >
                <span>Mulai Proyek</span>
                <span aria-hidden="true">→</span>
              </a>
              <a
                href="#mixer"
                class="brutal-btn bg-white text-ink px-6 py-3.5 text-base"
              >
                Coba Brand Mixer
              </a>
            </div>
          </div>

          <!-- Trust Row of 3 Small Stat Tags (mono) -->
          <div class="mt-8 pt-6 border-t-2 border-ink/15 flex flex-wrap items-center gap-2.5">
            <span class="px-3 py-1.5 bg-paper-dark border-2 border-ink font-mono text-xs font-bold">
              120+ UMKM
            </span>
            <span class="px-3 py-1.5 bg-paper-dark border-2 border-ink font-mono text-xs font-bold">
              7 hari kerja
            </span>
            <span class="px-3 py-1.5 bg-paper-dark border-2 border-ink font-mono text-xs font-bold">
              Revisi 3x
            </span>
          </div>
        </div>

        <!-- RIGHT COLUMN: Meja Kerja Lab Scene (~55% Desktop, ~340px Mobile) -->
        <div
          ref="stageWrapRef"
          class="relative h-[340px] sm:h-[420px] lg:h-auto lg:min-h-[540px] bg-paper bg-lab-dots overflow-hidden select-none"
        >
          <!-- SSR & Reduced-Motion / No-WebGL Static SVG Composition (Replaced smoothly once canvas mounts) -->
          <div
            v-if="!sceneReady || staticFallback"
            class="absolute inset-0 flex items-center justify-center p-4 sm:p-6"
          >
            <img
              src="/hero-fallback.svg"
              alt="Ilustrasi meja kerja studio desain Arc Lab berisi logo busur, kemasan kotak, kaleng, cangkir, dan palet warna"
              width="680"
              height="520"
              class="w-full h-full object-contain"
            />
          </div>

          <!-- Client-Only Three.js Interactive Desk Canvas -->
          <ClientOnly>
            <div
              v-show="sceneReady && !staticFallback"
              ref="canvasMountRef"
              data-cursor-grow
              class="w-full h-full"
              :class="[
                isDraggingScene
                  ? 'cursor-grabbing'
                  : isHoveringObject
                    ? 'cursor-pointer'
                    : 'cursor-grab'
              ]"
            ></div>
          </ClientOnly>

          <!-- Following Mono Caption Tag Overlay on Hover -->
          <div
            v-if="hoveredCaption.visible && sceneReady && !staticFallback"
            aria-hidden="true"
            class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full px-2.5 py-1 bg-ink text-paper border-2 border-ink font-mono text-[11px] font-bold uppercase tracking-wider shadow-brutal-sm transition-transform duration-75"
            :style="{ left: `${hoveredCaption.x}px`, top: `${hoveredCaption.y}px` }"
          >
            {{ hoveredCaption.text }}
          </div>

          <!-- Bottom Hint Chip + Keyboard Accessible "Ganti warna" Button -->
          <div
            v-if="sceneReady && !staticFallback"
            class="absolute bottom-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none"
          >
            <span class="px-3 py-1 bg-paper/95 border-2 border-ink font-mono text-[11px] font-bold shadow-brutal-sm">
              Klik &amp; geser objeknya
            </span>

            <button
              type="button"
              class="pointer-events-auto px-3 py-1 bg-yellow hover:bg-cyan border-2 border-ink font-mono text-xs font-bold shadow-brutal-sm transition-transform hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              @click="handleCycleColorsButton"
            >
              Ganti warna
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
