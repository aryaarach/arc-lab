<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

type ShapeId = 'box' | 'can' | 'cup'
type VibeId = 'Minimalis' | 'Playful' | 'Premium' | 'Retro'

interface Swatch {
  name: string
  hex: string
  textOnFill: string
}

const config = useAppConfig()

const brandName = ref('KOPI SENJA')
const selectedShape = ref<ShapeId>('box')
const selectedVibe = ref<VibeId>('Playful')

const swatches: Swatch[] = [
  { name: 'Kuning Lab', hex: '#FFD84D', textOnFill: '#0B0B0F' },
  { name: 'Indigo Elektrik', hex: '#5B5BFF', textOnFill: '#F4F1EA' },
  { name: 'Sian Tropis', hex: '#22E6D0', textOnFill: '#0B0B0F' },
  { name: 'Koral Pedas', hex: '#FF6B4A', textOnFill: '#0B0B0F' },
  { name: 'Hijau Matcha', hex: '#22B573', textOnFill: '#0B0B0F' },
  { name: 'Hitam Pekat', hex: '#1B1B24', textOnFill: '#F4F1EA' }
]

const selectedColor = ref<Swatch>(swatches[0])

const shapes: { id: ShapeId; label: string; desc: string }[] = [
  { id: 'box', label: 'Box Produk', desc: 'Snack / Teh / Kosmetik' },
  { id: 'can', label: 'Kaleng', desc: 'Kopi Susu / Soda Lokal' },
  { id: 'cup', label: 'Cup Minuman', desc: 'Es Kopi / Boba / Jus' }
]

const vibes: VibeId[] = ['Minimalis', 'Playful', 'Premium', 'Retro']

const stageRef = ref<HTMLElement | null>(null)
const webglFailed = ref(false)
const fallbackPreviewUrl = ref('')
const bounceCounter = ref(0)

const displayBrand = computed(() => {
  const trimmed = brandName.value.trim()
  return (trimmed || 'BRAND KAMU').slice(0, 18)
})

const shapeLabel = computed(() => shapes.find((s) => s.id === selectedShape.value)?.label || 'Box Produk')

const waDeepLink = computed(() => {
  const text = [
    'Halo Arc Lab! Saya sudah mencoba *3D Brand Mixer* di website dan ingin konsultasi desain kemasan:',
    `• Nama Brand: ${displayBrand.value}`,
    `• Bentuk Kemasan: ${shapeLabel.value}`,
    `• Gaya Visual: ${selectedVibe.value}`,
    `• Warna Utama: ${selectedColor.value.name} (${selectedColor.value.hex})`,
    '',
    'Boleh info estimasi pengerjaan dan langkah selanjutnya?'
  ].join('\n')
  return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(text)}`
})

function drawStarburst(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function drawLabelCanvas(
  name: string,
  vibe: VibeId,
  swatch: Swatch,
  shape: ShapeId
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const W = 1024
  const H = 1024
  const upperName = name.toUpperCase()

  // Base fill
  ctx.fillStyle = swatch.hex
  ctx.fillRect(0, 0, W, H)

  // Split words nicely if > 10 chars
  const words = upperName.split(/\s+/).filter(Boolean)
  let line1 = upperName
  let line2 = ''
  if (upperName.length > 10 && words.length >= 2) {
    const mid = Math.ceil(words.length / 2)
    line1 = words.slice(0, mid).join(' ')
    line2 = words.slice(mid).join(' ')
  }

  if (vibe === 'Minimalis') {
    // Clean Swiss Neo-Lab Label
    ctx.fillStyle = '#F4F1EA'
    ctx.fillRect(76, 86, W - 152, H - 172)
    ctx.lineWidth = 14
    ctx.strokeStyle = '#0B0B0F'
    ctx.strokeRect(76, 86, W - 152, H - 172)

    // Top color header bar
    ctx.fillStyle = swatch.hex
    ctx.fillRect(83, 93, W - 166, 150)
    ctx.beginPath()
    ctx.moveTo(76, 243)
    ctx.lineTo(W - 76, 243)
    ctx.lineWidth = 10
    ctx.strokeStyle = '#0B0B0F'
    ctx.stroke()

    ctx.fillStyle = swatch.textOnFill
    ctx.font = '700 34px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('ARC LAB // SERI 01', 124, 180)

    // Minimalist geometric arc emblem
    ctx.strokeStyle = '#0B0B0F'
    ctx.lineWidth = 18
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(W / 2, 415, 86, Math.PI * 0.75, Math.PI * 2.25)
    ctx.stroke()
    ctx.fillStyle = swatch.hex === '#FFD84D' ? '#5B5BFF' : swatch.hex
    ctx.beginPath()
    ctx.arc(W / 2, 415, 28, 0, Math.PI * 2)
    ctx.fill()

    // Brand Title
    ctx.fillStyle = '#0B0B0F'
    ctx.textAlign = 'center'
    ctx.font = '800 84px "Space Grotesk", sans-serif'
    if (line2) {
      ctx.fillText(line1, W / 2, 620, W - 220)
      ctx.fillText(line2, W / 2, 710, W - 220)
    } else {
      ctx.fillText(line1, W / 2, 665, W - 220)
    }

    // Bottom specs rule
    ctx.beginPath()
    ctx.moveTo(124, 790)
    ctx.lineTo(W - 124, 790)
    ctx.lineWidth = 6
    ctx.strokeStyle = '#0B0B0F'
    ctx.stroke()

    ctx.font = '600 30px "JetBrains Mono", monospace'
    ctx.fillStyle = '#0B0B0F'
    ctx.fillText(shape === 'box' ? 'BERAT BERSIH 250G · UMKM ID' : 'ISI BERSIH 330ML · SEGAR', W / 2, 855)
  } else if (vibe === 'Playful') {
    // Pop Neo-Brutalist Confetti & Starburst
    const dotColor = swatch.textOnFill === '#F4F1EA' ? 'rgba(244,241,234,0.22)' : 'rgba(11,11,15,0.14)'
    ctx.fillStyle = dotColor
    for (let x = 48; x < W; x += 96) {
      for (let y = 48; y < H; y += 96) {
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Hard-shadow central card
    ctx.fillStyle = '#0B0B0F'
    ctx.fillRect(116, 176, W - 212, H - 332)
    ctx.fillStyle = '#F4F1EA'
    ctx.fillRect(98, 158, W - 212, H - 332)
    ctx.lineWidth = 14
    ctx.strokeStyle = '#0B0B0F'
    ctx.strokeRect(98, 158, W - 212, H - 332)

    // Starburst sticker top-right
    drawStarburst(ctx, W - 190, 225, 12, 115, 82)
    ctx.fillStyle = swatch.hex === '#FF6B4A' ? '#FFD84D' : '#FF6B4A'
    ctx.fill()
    ctx.lineWidth = 10
    ctx.strokeStyle = '#0B0B0F'
    ctx.stroke()

    ctx.save()
    ctx.translate(W - 190, 225)
    ctx.rotate(-0.18)
    ctx.fillStyle = '#0B0B0F'
    ctx.textAlign = 'center'
    ctx.font = '800 32px "Space Grotesk", sans-serif'
    ctx.fillText('100%', 0, -4)
    ctx.fillText('LOKAL!', 0, 32)
    ctx.restore()

    // Pill tag
    ctx.fillStyle = '#22E6D0'
    ctx.fillRect(156, 238, 320, 68)
    ctx.strokeRect(156, 238, 320, 68)
    ctx.fillStyle = '#0B0B0F'
    ctx.textAlign = 'left'
    ctx.font = '700 30px "JetBrains Mono", monospace'
    ctx.fillText('★ RASA JUARA', 184, 283)

    // Big bold brand name
    ctx.textAlign = 'center'
    ctx.font = '800 96px "Space Grotesk", sans-serif'
    ctx.fillStyle = '#0B0B0F'
    if (line2) {
      ctx.fillText(line1, W / 2 + 5, 495, W - 260)
      ctx.fillText(line2, W / 2 + 5, 598, W - 260)
    } else {
      ctx.fillText(line1, W / 2 + 5, 548, W - 260)
    }

    // Wavy bottom accent bar
    ctx.fillStyle = '#FFD84D'
    ctx.fillRect(156, 685, W - 312, 92)
    ctx.lineWidth = 10
    ctx.strokeRect(156, 685, W - 312, 92)
    ctx.fillStyle = '#0B0B0F'
    ctx.font = '700 34px "Space Grotesk", sans-serif'
    ctx.fillText('KUALITAS UMKM NAIK KELAS', W / 2, 743)
  } else if (vibe === 'Premium') {
    // Editorial Dark Crest + Gold Accent
    ctx.fillStyle = '#0B0B0F'
    ctx.fillRect(68, 78, W - 136, H - 156)

    // Double gold/accent border
    ctx.strokeStyle = '#FFD84D'
    ctx.lineWidth = 8
    ctx.strokeRect(102, 112, W - 204, H - 224)
    ctx.lineWidth = 3
    ctx.strokeRect(122, 132, W - 244, H - 264)

    // Accent top diamond crest
    ctx.save()
    ctx.translate(W / 2, 275)
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = swatch.hex === '#1B1B24' ? '#FFD84D' : swatch.hex
    ctx.fillRect(-52, -52, 104, 104)
    ctx.strokeStyle = '#F4F1EA'
    ctx.lineWidth = 6
    ctx.strokeRect(-52, -52, 104, 104)
    ctx.restore()

    ctx.fillStyle = swatch.hex === '#1B1B24' ? '#0B0B0F' : swatch.textOnFill
    ctx.textAlign = 'center'
    ctx.font = '700 34px "Space Grotesk", sans-serif'
    ctx.fillText('AL', W / 2, 287)

    ctx.fillStyle = '#FFD84D'
    ctx.font = '600 28px "JetBrains Mono", monospace'
    ctx.fillText('KOLEKSI PREMIUM NUSANTARA', W / 2, 415)

    ctx.fillStyle = '#F4F1EA'
    ctx.font = '700 88px "Space Grotesk", sans-serif'
    if (line2) {
      ctx.fillText(line1, W / 2, 545, W - 270)
      ctx.fillText(line2, W / 2, 642, W - 270)
    } else {
      ctx.fillText(line1, W / 2, 590, W - 270)
    }

    ctx.strokeStyle = '#FFD84D'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(260, 725)
    ctx.lineTo(W - 260, 725)
    ctx.stroke()

    ctx.fillStyle = '#F4F1EA'
    ctx.font = '500 28px "JetBrains Mono", monospace'
    ctx.fillText('DIPRODUKSI DENGAN STANDAR TERBAIK', W / 2, 805)
  } else {
    // Retro Nusantara Stripes & Badge
    ctx.fillStyle = '#F4F1EA'
    ctx.fillRect(64, 74, W - 128, H - 148)
    ctx.lineWidth = 14
    ctx.strokeStyle = '#0B0B0F'
    ctx.strokeRect(64, 74, W - 128, H - 148)

    // Vintage horizontal stripes
    const stripeColors = ['#FF6B4A', '#FFD84D', '#22E6D0', swatch.hex]
    stripeColors.forEach((sc, idx) => {
      ctx.fillStyle = sc
      ctx.fillRect(72, 175 + idx * 34, W - 144, 26)
    })

    // Circular vintage emblem
    ctx.beginPath()
    ctx.arc(W / 2, 515, 255, 0, Math.PI * 2)
    ctx.fillStyle = swatch.hex
    ctx.fill()
    ctx.lineWidth = 14
    ctx.strokeStyle = '#0B0B0F'
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(W / 2, 515, 228, 0, Math.PI * 2)
    ctx.lineWidth = 5
    ctx.strokeStyle = swatch.textOnFill
    ctx.stroke()

    // Ribbon banner across circle
    ctx.fillStyle = '#0B0B0F'
    ctx.fillRect(118, 430, W - 236, 185)
    ctx.fillStyle = '#FFD84D'
    ctx.fillRect(108, 420, W - 236, 185)
    ctx.lineWidth = 12
    ctx.strokeStyle = '#0B0B0F'
    ctx.strokeRect(108, 420, W - 236, 185)

    ctx.fillStyle = '#0B0B0F'
    ctx.textAlign = 'center'
    ctx.font = '800 82px "Space Grotesk", sans-serif'
    if (line2) {
      ctx.fillText(line1, W / 2 - 4, 502, W - 280)
      ctx.fillText(line2, W / 2 - 4, 582, W - 280)
    } else {
      ctx.fillText(line1, W / 2 - 4, 540, W - 280)
    }

    ctx.fillStyle = swatch.textOnFill
    ctx.font = '700 30px "JetBrains Mono", monospace'
    ctx.fillText('SEJAK 2026', W / 2, 365)
    ctx.fillText('RESEP OTENTIK', W / 2, 685)

    ctx.fillStyle = '#0B0B0F'
    ctx.font = '700 30px "JetBrains Mono", monospace'
    ctx.fillText('★ CITARASA ASLI INDONESIA ★', W / 2, 875)
  }

  return canvas
}

// Three.js state references
let rebuildSceneMesh: (() => void) | null = null
let triggerBounceFn: (() => void) | null = null
let disposeSceneAll: (() => void) | null = null

function handleManualBounce() {
  triggerBounceFn?.()
}

watch([displayBrand, selectedShape, selectedVibe, selectedColor], () => {
  if (webglFailed.value) {
    const c = drawLabelCanvas(displayBrand.value, selectedVibe.value, selectedColor.value, selectedShape.value)
    fallbackPreviewUrl.value = c.toDataURL('image/png')
    return
  }
  rebuildSceneMesh?.()
})

onMounted(async () => {
  if (typeof window === 'undefined') return
  const el = stageRef.value
  if (!el) return

  let THREE: typeof import('three')
  let OrbitControlsMod: typeof import('three/addons/controls/OrbitControls.js')

  try {
    ;[THREE, OrbitControlsMod] = await Promise.all([
      import('three'),
      import('three/addons/controls/OrbitControls.js')
    ])
  } catch {
    webglFailed.value = true
    fallbackPreviewUrl.value = drawLabelCanvas(displayBrand.value, selectedVibe.value, selectedColor.value, selectedShape.value).toDataURL('image/png')
    return
  }

  if (!stageRef.value) return

  let renderer: import('three').WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch {
    webglFailed.value = true
    fallbackPreviewUrl.value = drawLabelCanvas(displayBrand.value, selectedVibe.value, selectedColor.value, selectedShape.value).toDataURL('image/png')
    return
  }

  const getSize = () => ({
    width: Math.max(el.clientWidth, 280),
    height: Math.max(el.clientHeight, 340)
  })

  const initSz = getSize()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(initSz.width, initSz.height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, initSz.width / initSz.height, 0.1, 100)
  camera.position.set(2.8, 1.55, 4.4)

  const controls = new OrbitControlsMod.OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  controls.autoRotateSpeed = 2.0
  controls.enableZoom = false // Prevent scroll hijacking
  controls.enablePan = false
  controls.minPolarAngle = Math.PI * 0.22
  controls.maxPolarAngle = Math.PI * 0.72

  // Studio Lights
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd8d2c5, 1.65)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.85)
  dirLight.position.set(5, 8, 6)
  const fillLight = new THREE.DirectionalLight(0xfff4d6, 0.75)
  fillLight.position.set(-5, 2, -4)
  scene.add(hemiLight, dirLight, fillLight)

  // Subtle floor shadow disc
  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = 128
  shadowCanvas.height = 128
  const shCtx = shadowCanvas.getContext('2d')
  if (shCtx) {
    const grad = shCtx.createRadialGradient(64, 64, 8, 64, 64, 60)
    grad.addColorStop(0, 'rgba(11,11,15,0.28)')
    grad.addColorStop(1, 'rgba(11,11,15,0)')
    shCtx.fillStyle = grad
    shCtx.fillRect(0, 0, 128, 128)
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas)
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 3.2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  )
  shadowPlane.rotation.x = -Math.PI / 2
  shadowPlane.position.y = -1.35
  scene.add(shadowPlane)

  const pivotGroup = new THREE.Group()
  scene.add(pivotGroup)

  let currentProductGroup: import('three').Group | null = null

  const disposeObject3D = (root: import('three').Object3D) => {
    root.traverse((child) => {
      const mesh = child as import('three').Mesh
      if (mesh.isMesh) {
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) {
          if (!m) continue
          const stdMat = m as import('three').MeshStandardMaterial
          stdMat.map?.dispose()
          m.dispose()
        }
      }
    })
  }

  const buildMesh = () => {
    if (currentProductGroup) {
      pivotGroup.remove(currentProductGroup)
      disposeObject3D(currentProductGroup)
      currentProductGroup = null
    }

    const group = new THREE.Group()
    const labelCanvas = drawLabelCanvas(
      displayBrand.value,
      selectedVibe.value,
      selectedColor.value,
      selectedShape.value
    )
    const labelTexture = new THREE.CanvasTexture(labelCanvas)
    labelTexture.colorSpace = THREE.SRGBColorSpace
    labelTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4)

    const swatchColor = new THREE.Color(selectedColor.value.hex)

    if (selectedShape.value === 'box') {
      const sideMat = new THREE.MeshStandardMaterial({
        color: swatchColor,
        roughness: 0.42,
        metalness: 0.05
      })
      const topMat = new THREE.MeshStandardMaterial({
        color: 0xf4f1ea,
        roughness: 0.5,
        metalness: 0.04
      })
      const labelMat = new THREE.MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.36,
        metalness: 0.06
      })

      const boxGeo = new THREE.BoxGeometry(1.72, 2.32, 1.05)
      const boxMesh = new THREE.Mesh(boxGeo, [
        sideMat,
        sideMat,
        topMat,
        sideMat,
        labelMat,
        labelMat
      ])

      // Crisp Neo-Brutalist top tuck flap strip
      const flapGeo = new THREE.BoxGeometry(1.74, 0.08, 1.07)
      const flapMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0f, roughness: 0.6 })
      const flapMesh = new THREE.Mesh(flapGeo, flapMat)
      flapMesh.position.y = 1.16

      group.add(boxMesh, flapMesh)
    } else if (selectedShape.value === 'can') {
      labelTexture.wrapS = THREE.RepeatWrapping
      labelTexture.repeat.set(2, 1)

      const bodyMat = new THREE.MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.25,
        metalness: 0.32
      })
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0xdadce0,
        roughness: 0.22,
        metalness: 0.85
      })

      const bodyGeo = new THREE.CylinderGeometry(0.88, 0.88, 2.2, 56, 1, false)
      const bodyMesh = new THREE.Mesh(bodyGeo, [bodyMat, metalMat, metalMat])

      const topRimGeo = new THREE.TorusGeometry(0.86, 0.045, 16, 48)
      const topRim = new THREE.Mesh(topRimGeo, metalMat)
      topRim.rotation.x = Math.PI / 2
      topRim.position.y = 1.1

      const botRim = new THREE.Mesh(topRimGeo.clone(), metalMat)
      botRim.rotation.x = Math.PI / 2
      botRim.position.y = -1.1

      const tabGeo = new THREE.BoxGeometry(0.32, 0.04, 0.48)
      const tabMesh = new THREE.Mesh(tabGeo, new THREE.MeshStandardMaterial({ color: 0x0b0b0f, metalness: 0.5, roughness: 0.3 }))
      tabMesh.position.set(0, 1.12, 0.1)

      group.add(bodyMesh, topRim, botRim, tabMesh)
    } else {
      // Cup (Tapered Coffee / Boba Cup + Lid)
      labelTexture.wrapS = THREE.RepeatWrapping
      labelTexture.repeat.set(2, 1)

      const cupWrapMat = new THREE.MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.45,
        metalness: 0.04
      })
      const innerBottomMat = new THREE.MeshStandardMaterial({
        color: 0xf4f1ea,
        roughness: 0.6
      })

      const cupGeo = new THREE.CylinderGeometry(0.98, 0.68, 2.15, 56, 1, false)
      const cupMesh = new THREE.Mesh(cupGeo, [cupWrapMat, innerBottomMat, innerBottomMat])
      cupMesh.position.y = -0.08

      // Dome / Flat Barista Lid
      const lidMat = new THREE.MeshStandardMaterial({
        color: 0x0b0b0f,
        roughness: 0.35,
        metalness: 0.1
      })
      const lidRimGeo = new THREE.CylinderGeometry(1.04, 1.04, 0.14, 56)
      const lidRim = new THREE.Mesh(lidRimGeo, lidMat)
      lidRim.position.y = 1.03

      const lidTopGeo = new THREE.CylinderGeometry(0.92, 1.0, 0.16, 56)
      const lidTop = new THREE.Mesh(lidTopGeo, lidMat)
      lidTop.position.y = 1.16

      group.add(cupMesh, lidRim, lidTop)
    }

    currentProductGroup = group
    pivotGroup.add(group)
  }

  rebuildSceneMesh = buildMesh
  buildMesh()

  // Bounce animation state
  let bounceActive = false
  let bounceElapsed = 0

  const startBounce = () => {
    bounceActive = true
    bounceElapsed = 0
    bounceCounter.value++
  }
  triggerBounceFn = startBounce

  // Raycast click detection (distinguish click vs orbit drag)
  const raycaster = new THREE.Raycaster()
  const pointerDownPos = { x: 0, y: 0 }

  const onPointerDown = (e: PointerEvent) => {
    pointerDownPos.x = e.clientX
    pointerDownPos.y = e.clientY
  }

  const onPointerUp = (e: PointerEvent) => {
    const dx = e.clientX - pointerDownPos.x
    const dy = e.clientY - pointerDownPos.y
    if (dx * dx + dy * dy > 36) return // Was a drag, not a click
    if (!currentProductGroup) return

    const rect = renderer.domElement.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 + 1) + 2
    )
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    )
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObject(currentProductGroup, true)
    if (hits.length > 0) {
      startBounce()
    }
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointerup', onPointerUp)

  // Render loop + offscreen observer
  let rafId = 0
  let running = false
  let inView = true
  let lastTime = performance.now()

  const animate = (now: number) => {
    if (!running) return
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now

    if (bounceActive) {
      bounceElapsed += dt
      const duration = 0.68
      if (bounceElapsed >= duration) {
        bounceActive = false
        pivotGroup.position.y = 0
        pivotGroup.scale.set(1, 1, 1)
      } else {
        const p = bounceElapsed / duration
        const decay = Math.exp(-4.5 * p)
        const wave = Math.sin(p * Math.PI * 3.2)
        pivotGroup.position.y = Math.abs(wave) * decay * 0.55
        const stretch = 1 + wave * decay * 0.16
        const squash = 1 - wave * decay * 0.1
        pivotGroup.scale.set(squash, stretch, squash)
      }
    }

    controls.update()
    renderer.render(scene, camera)
    rafId = window.requestAnimationFrame(animate)
  }

  const startLoop = () => {
    if (!running && inView && !document.hidden) {
      running = true
      lastTime = performance.now()
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
    io.observe(el)
  }

  const onVisChange = () => {
    if (document.hidden) stopLoop()
    else startLoop()
  }
  document.addEventListener('visibilitychange', onVisChange)

  const onResize = () => {
    if (!stageRef.value) return
    const { width, height } = getSize()
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
  }
  window.addEventListener('resize', onResize)

  startLoop()

  disposeSceneAll = () => {
    stopLoop()
    io?.disconnect()
    document.removeEventListener('visibilitychange', onVisChange)
    window.removeEventListener('resize', onResize)
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    controls.dispose()
    if (currentProductGroup) {
      disposeObject3D(currentProductGroup)
    }
    shadowPlane.geometry.dispose()
    ;(shadowPlane.material as import('three').MeshBasicMaterial).dispose()
    shadowTex.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode === el) {
      el.removeChild(renderer.domElement)
    }
  }
})

onBeforeUnmount(() => {
  disposeSceneAll?.()
  disposeSceneAll = null
  rebuildSceneMesh = null
  triggerBounceFn = null
})
</script>

<template>
  <section id="mixer" class="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-2 border-ink bg-paper-dark/60">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div v-reveal class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span class="brutal-tag bg-indigo text-paper mb-3">EKSPERIMEN INTERAKTIF // LAB 02</span>
          <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            3D Brand &amp; Kemasan Mixer
          </h2>
        </div>
        <p class="max-w-md text-sm sm:text-base text-ink/80">
          Ketik nama brand UMKM-mu, pilih bentuk kemasan dan gaya visual, lalu putar mockup 3D secara langsung sebelum kirim ke WhatsApp kami.
        </p>
      </div>

      <!-- 2-Column Interactive Studio -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <!-- Controls Form (5 cols) -->
        <div v-reveal="80" class="lg:col-span-5 brutal-card p-6 sm:p-7 flex flex-col justify-between gap-6">
          <div class="flex flex-col gap-5">
            <!-- 1. Brand Name Input -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="mixer-brand-input" class="font-mono text-xs font-bold uppercase tracking-wider">
                  1. Nama Brand UMKM
                </label>
                <span class="font-mono text-xs text-ink/70">{{ brandName.length }}/18</span>
              </div>
              <input
                id="mixer-brand-input"
                v-model="brandName"
                type="text"
                maxlength="18"
                placeholder="Contoh: KOPI SENJA"
                class="w-full px-4 py-3 bg-paper border-2 border-ink font-display font-bold text-base shadow-brutal-sm focus:bg-yellow/25 focus:outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>

            <!-- 2. Shape Selector -->
            <fieldset>
              <legend class="font-mono text-xs font-bold uppercase tracking-wider mb-2">
                2. Pilih Bentuk Kemasan
              </legend>
              <div class="grid grid-cols-3 gap-2.5">
                <button
                  v-for="s in shapes"
                  :key="s.id"
                  type="button"
                  :aria-pressed="selectedShape === s.id ? 'true' : 'false'"
                  class="p-3 text-left border-2 border-ink transition-all"
                  :class="
                    selectedShape === s.id
                      ? 'bg-yellow shadow-brutal-sm -translate-y-0.5'
                      : 'bg-paper hover:bg-paper-dark'
                  "
                  @click="selectedShape = s.id"
                >
                  <div class="font-display font-bold text-sm leading-tight">{{ s.label }}</div>
                  <div class="font-mono text-[10px] text-ink/70 mt-1 leading-snug">{{ s.desc }}</div>
                </button>
              </div>
            </fieldset>

            <!-- 3. Vibe Selector -->
            <fieldset>
              <legend class="font-mono text-xs font-bold uppercase tracking-wider mb-2">
                3. Gaya Visual Label
              </legend>
              <div class="grid grid-cols-2 gap-2.5">
                <button
                  v-for="v in vibes"
                  :key="v"
                  type="button"
                  :aria-pressed="selectedVibe === v ? 'true' : 'false'"
                  class="px-3.5 py-2.5 border-2 border-ink font-display font-bold text-sm flex items-center justify-between transition-all"
                  :class="
                    selectedVibe === v
                      ? 'bg-cyan shadow-brutal-sm -translate-y-0.5'
                      : 'bg-paper hover:bg-paper-dark'
                  "
                  @click="selectedVibe = v"
                >
                  <span>{{ v }}</span>
                  <span v-if="selectedVibe === v" aria-hidden="true">●</span>
                </button>
              </div>
            </fieldset>

            <!-- 4. Color Swatches (6 swatches) -->
            <fieldset>
              <legend class="font-mono text-xs font-bold uppercase tracking-wider mb-2">
                4. Warna Utama: <span class="text-indigo">{{ selectedColor.name }}</span>
              </legend>
              <div class="flex flex-wrap items-center gap-3">
                <button
                  v-for="sw in swatches"
                  :key="sw.hex"
                  type="button"
                  :aria-label="`Pilih warna ${sw.name}`"
                  :aria-pressed="selectedColor.hex === sw.hex ? 'true' : 'false'"
                  class="w-10 h-10 border-2 border-ink transition-transform flex items-center justify-center"
                  :class="selectedColor.hex === sw.hex ? 'scale-110 shadow-brutal-sm ring-2 ring-indigo ring-offset-2 ring-offset-paper' : 'hover:scale-105'"
                  :style="{ backgroundColor: sw.hex }"
                  @click="selectedColor = sw"
                >
                  <span
                    v-if="selectedColor.hex === sw.hex"
                    class="font-mono text-xs font-bold"
                    :style="{ color: sw.textOnFill }"
                    aria-hidden="true"
                  >✓</span>
                </button>
              </div>
            </fieldset>
          </div>

          <!-- WhatsApp Deep-Link CTA -->
          <div class="pt-4 border-t-2 border-ink">
            <a
              :href="waDeepLink"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full brutal-btn bg-coral text-ink px-5 py-3.5 text-base text-center"
            >
              <span>Wujudkan Kemasan Ini via WhatsApp</span>
              <span aria-hidden="true">→</span>
            </a>
            <p class="font-mono text-[11px] text-ink/70 mt-2 text-center">
              Pilihanmu otomatis terisi di pesan WhatsApp · Gratis diskusi konsep
            </p>
          </div>
        </div>

        <!-- 3D Viewport Stage (7 cols) -->
        <div v-reveal="150" class="lg:col-span-7 brutal-card overflow-hidden flex flex-col min-h-[420px] sm:min-h-[500px]">
          <!-- Top Bar -->
          <div class="h-10 px-4 bg-ink text-paper flex items-center justify-between font-mono text-xs uppercase tracking-wider">
            <span>PREVIEW 3D // {{ shapeLabel }} · {{ selectedVibe }}</span>
            <span class="text-cyan hidden sm:inline">GESER UNTUK PUTAR · KLIK OBJEK</span>
          </div>

          <!-- Fallback 2D Label if WebGL unavailable -->
          <div v-if="webglFailed" class="flex-1 flex flex-col items-center justify-center p-6 bg-lab-grid gap-3">
            <img
              v-if="fallbackPreviewUrl"
              :src="fallbackPreviewUrl"
              :alt="`Pratinjau label ${displayBrand}`"
              class="w-64 h-64 border-2 border-ink shadow-brutal object-contain"
            />
            <p class="font-mono text-xs text-ink/75 text-center">Mode pratinjau 2D (WebGL tidak tersedia di perangkat ini).</p>
          </div>

          <!-- Interactive Three.js Stage -->
          <div
            v-else
            ref="stageRef"
            data-cursor-grow
            class="relative flex-1 w-full bg-lab-grid cursor-grab active:cursor-grabbing"
            role="img"
            :aria-label="`Mockup 3D ${shapeLabel} untuk brand ${displayBrand} dengan gaya ${selectedVibe}`"
          ></div>

          <!-- Bottom Status Bar -->
          <div class="px-4 py-3 border-t-2 border-ink bg-paper flex flex-wrap items-center justify-between gap-2">
            <div class="font-mono text-xs">
              <span class="font-bold">KLIK OBJEK 3D</span> untuk efek pantul · Zoom dinonaktifkan agar halaman nyaman di-scroll
            </div>
            <button
              v-if="!webglFailed"
              type="button"
              class="px-3 py-1 bg-yellow border-2 border-ink font-mono text-xs font-bold uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              @click="handleManualBounce"
            >
              Pantulkan! <span v-if="bounceCounter > 0">({{ bounceCounter }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
