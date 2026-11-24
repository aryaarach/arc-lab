<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const containerRef = ref<HTMLElement | null>(null)
const useStaticFallback = ref(false)
const explosionCount = ref(0)

let cleanupFn: (() => void) | null = null
let triggerExplosionFn: (() => void) | null = null

function handleManualExplosion() {
  triggerExplosionFn?.()
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced || !isWebGLAvailable()) {
    useStaticFallback.value = true
    return
  }

  const el = containerRef.value
  if (!el) return

  let THREE: typeof import('three')
  try {
    THREE = await import('three')
  } catch {
    useStaticFallback.value = true
    return
  }

  if (!containerRef.value) return

  let renderer: import('three').WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
  } catch {
    useStaticFallback.value = true
    return
  }

  const getSize = () => ({
    width: Math.max(el.clientWidth, 280),
    height: Math.max(el.clientHeight, 320)
  })

  const initial = getSize()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(initial.width, initial.height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(48, initial.width / initial.height, 0.1, 100)
  camera.position.set(0, 0, 7.2)

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.35)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
  keyLight.position.set(4, 6, 6)
  const rimLight = new THREE.PointLight(0x22e6d0, 18, 16)
  rimLight.position.set(-4, -3, 4)
  scene.add(ambientLight, keyLight, rimLight)

  // Central Neo-Brutalist Lab Group
  const centerGroup = new THREE.Group()
  scene.add(centerGroup)

  // Partial Arc Ring (TorusGeometry partial)
  const arcGeo = new THREE.TorusGeometry(1.75, 0.17, 28, 128, Math.PI * 1.58)
  const arcMat = new THREE.MeshStandardMaterial({
    color: 0x5b5bff,
    roughness: 0.28,
    metalness: 0.18
  })
  const arcMesh = new THREE.Mesh(arcGeo, arcMat)
  arcMesh.rotation.z = Math.PI * 0.71

  // Crisp ink outline torus around arc
  const arcWireGeo = new THREE.TorusGeometry(1.75, 0.185, 12, 64, Math.PI * 1.58)
  const arcWireMat = new THREE.MeshBasicMaterial({
    color: 0x0b0b0f,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  })
  const arcWireMesh = new THREE.Mesh(arcWireGeo, arcWireMat)
  arcWireMesh.rotation.z = Math.PI * 0.71

  // Wireframe Icosahedron
  const icoGeo = new THREE.IcosahedronGeometry(0.98, 1)
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0x0b0b0f,
    wireframe: true
  })
  const icoMesh = new THREE.Mesh(icoGeo, icoMat)

  // Inner Core Sphere (Center Dot of Arc Lab Logo)
  const coreGeo = new THREE.SphereGeometry(0.32, 24, 24)
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xff6b4a,
    roughness: 0.3,
    metalness: 0.1
  })
  const coreMesh = new THREE.Mesh(coreGeo, coreMat)

  centerGroup.add(arcMesh, arcWireMesh, icoMesh, coreMesh)

  // 1,800 Interactive Lab Particles
  const PARTICLE_COUNT = 1800
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const homePositions = new Float32Array(PARTICLE_COUNT * 3)
  const velocities = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const baseColors = new Float32Array(PARTICLE_COUNT * 3)
  const targetColors = new Float32Array(PARTICLE_COUNT * 3)

  const paletteHex = [0x0b0b0f, 0x5b5bff, 0x22e6d0, 0xff6b4a, 0xffd84d]
  const paletteRGB = paletteHex.map((hex) => {
    const c = new THREE.Color(hex)
    return [c.r, c.g, c.b] as const
  })

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3
    // Spherical shell + orbital disc distribution
    const radius = 1.35 + Math.pow(Math.random(), 0.72) * 3.15
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    const hx = radius * Math.sin(phi) * Math.cos(theta) * 1.15
    const hy = radius * Math.sin(phi) * Math.sin(theta) * 0.95
    const hz = (radius * Math.cos(phi)) * 0.65

    positions[i3] = hx
    positions[i3 + 1] = hy
    positions[i3 + 2] = hz

    homePositions[i3] = hx
    homePositions[i3 + 1] = hy
    homePositions[i3 + 2] = hz

    // Bias base palette slightly toward ink + indigo + cyan for crisp contrast on #F4F1EA
    const pickIdx = i % 5 === 0 ? 0 : Math.floor(Math.random() * paletteRGB.length)
    const [r, g, b] = paletteRGB[pickIdx]
    colors[i3] = r
    colors[i3 + 1] = g
    colors[i3 + 2] = b
    baseColors[i3] = r
    baseColors[i3 + 1] = g
    baseColors[i3 + 2] = b
    targetColors[i3] = r
    targetColors[i3 + 1] = g
    targetColors[i3 + 2] = b
  }

  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Create crisp circular-square lab dot sprite texture
  const spriteCanvas = document.createElement('canvas')
  spriteCanvas.width = 32
  spriteCanvas.height = 32
  const sctx = spriteCanvas.getContext('2d')
  if (sctx) {
    sctx.fillStyle = '#0B0B0F'
    sctx.beginPath()
    sctx.arc(16, 16, 14, 0, Math.PI * 2)
    sctx.fill()
    sctx.fillStyle = '#FFFFFF'
    sctx.beginPath()
    sctx.arc(16, 16, 10.5, 0, Math.PI * 2)
    sctx.fill()
  }
  const spriteTex = new THREE.CanvasTexture(spriteCanvas)

  const particleMat = new THREE.PointsMaterial({
    size: 0.115,
    map: spriteTex,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.35,
    sizeAttenuation: true
  })

  const particleSystem = new THREE.Points(particleGeo, particleMat)
  scene.add(particleSystem)

  // Interaction state
  let pointerActive = false
  let pointerWorldX = 999
  let pointerWorldY = 999
  let tiltTargetX = 0
  let tiltTargetY = 0
  let ringSpinBoost = 0
  let colorRevertTimer = 0

  const updatePointerFromEvent = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    pointerActive = true
    tiltTargetX = ndcY * 0.32
    tiltTargetY = ndcX * 0.42

    // Project NDC onto z=0 world plane
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z
    const halfW = halfH * camera.aspect
    pointerWorldX = ndcX * halfW
    pointerWorldY = ndcY * halfH
  }

  const onPointerLeave = () => {
    pointerActive = false
    pointerWorldX = 999
    pointerWorldY = 999
    tiltTargetX = 0
    tiltTargetY = 0
  }

  const triggerExplosion = () => {
    explosionCount.value++
    ringSpinBoost = 0.32
    colorRevertTimer = 110 // frames before easing back to home palette

    // Randomize ring & core accent briefly
    const accentChoices = [0x5b5bff, 0x22e6d0, 0xff6b4a, 0xffd84d]
    arcMat.color.setHex(accentChoices[Math.floor(Math.random() * accentChoices.length)])
    coreMat.color.setHex(accentChoices[Math.floor(Math.random() * accentChoices.length)])

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const px = positions[i3]
      const py = positions[i3 + 1]
      const pz = positions[i3 + 2]
      const len = Math.sqrt(px * px + py * py + pz * pz) || 1
      const impulse = 0.24 + Math.random() * 0.48

      velocities[i3] += (px / len + (Math.random() - 0.5) * 0.35) * impulse
      velocities[i3 + 1] += (py / len + (Math.random() - 0.5) * 0.35) * impulse
      velocities[i3 + 2] += (pz / len + (Math.random() - 0.5) * 0.35) * impulse

      // Randomize particle color immediately on explosion
      const [rr, rg, rb] = paletteRGB[1 + Math.floor(Math.random() * (paletteRGB.length - 1))]
      colors[i3] = rr
      colors[i3 + 1] = rg
      colors[i3 + 2] = rb
    }
    particleGeo.attributes.color.needsUpdate = true
  }

  triggerExplosionFn = triggerExplosion

  const onCanvasClick = () => {
    triggerExplosion()
  }

  el.addEventListener('pointermove', updatePointerFromEvent, { passive: true })
  el.addEventListener('pointerleave', onPointerLeave, { passive: true })
  el.addEventListener('click', onCanvasClick)

  // Animation & visibility pause loop
  let rafId = 0
  let isRunning = false
  let isVisible = true
  const homeArcColor = new THREE.Color(0x5b5bff)
  const homeCoreColor = new THREE.Color(0xff6b4a)

  const renderFrame = () => {
    if (!isRunning) return

    // Spin central arc ring + wireframe icosahedron
    const baseSpin = 0.0065
    arcMesh.rotation.z += baseSpin + ringSpinBoost
    arcWireMesh.rotation.z = arcMesh.rotation.z
    icoMesh.rotation.x += 0.005 + ringSpinBoost * 0.5
    icoMesh.rotation.y += 0.008 + ringSpinBoost * 0.65

    // Ease spin boost & mesh colors back
    ringSpinBoost *= 0.945
    if (ringSpinBoost < 0.0002) ringSpinBoost = 0

    if (colorRevertTimer > 0) {
      colorRevertTimer--
    } else {
      arcMat.color.lerp(homeArcColor, 0.04)
      coreMat.color.lerp(homeCoreColor, 0.04)
    }

    centerGroup.rotation.x += (tiltTargetX - centerGroup.rotation.x) * 0.06
    centerGroup.rotation.y += (tiltTargetY - centerGroup.rotation.y) * 0.06

    const posAttr = particleGeo.attributes.position as import('three').BufferAttribute
    const colAttr = particleGeo.attributes.color as import('three').BufferAttribute
    const posArr = posAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    const repelRadiusSq = 2.15 * 2.15
    let colorsChanged = false

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const px = posArr[i3]
      const py = posArr[i3 + 1]
      const pz = posArr[i3 + 2]

      // Spring force back to home position
      let vx = velocities[i3] + (homePositions[i3] - px) * 0.038
      let vy = velocities[i3 + 1] + (homePositions[i3 + 1] - py) * 0.038
      let vz = velocities[i3 + 2] + (homePositions[i3 + 2] - pz) * 0.038

      // Mouse repulsion in world space
      if (pointerActive) {
        const dx = px - pointerWorldX
        const dy = py - pointerWorldY
        const distSq = dx * dx + dy * dy
        if (distSq < repelRadiusSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq)
          const force = ((2.15 - dist) / 2.15) * 0.085
          vx += (dx / dist) * force
          vy += (dy / dist) * force
          vz += (pz >= 0 ? 1 : -1) * force * 0.35
        }
      }

      // Smooth damping
      vx *= 0.87
      vy *= 0.87
      vz *= 0.87

      velocities[i3] = vx
      velocities[i3 + 1] = vy
      velocities[i3 + 2] = vz

      posArr[i3] = px + vx
      posArr[i3 + 1] = py + vy
      posArr[i3 + 2] = pz + vz

      // Ease randomized explosion colors back to base palette
      if (colorRevertTimer === 0) {
        const dr = baseColors[i3] - colArr[i3]
        const dg = baseColors[i3 + 1] - colArr[i3 + 1]
        const db = baseColors[i3 + 2] - colArr[i3 + 2]
        if (Math.abs(dr) > 0.003 || Math.abs(dg) > 0.003 || Math.abs(db) > 0.003) {
          colArr[i3] += dr * 0.045
          colArr[i3 + 1] += dg * 0.045
          colArr[i3 + 2] += db * 0.045
          colorsChanged = true
        }
      }
    }

    posAttr.needsUpdate = true
    if (colorsChanged) colAttr.needsUpdate = true

    renderer.render(scene, camera)
    rafId = window.requestAnimationFrame(renderFrame)
  }

  const startLoop = () => {
    if (!isRunning && isVisible && !document.hidden) {
      isRunning = true
      rafId = window.requestAnimationFrame(renderFrame)
    }
  }

  const stopLoop = () => {
    if (isRunning) {
      isRunning = false
      window.cancelAnimationFrame(rafId)
    }
  }

  // IntersectionObserver to pause render loop when hero is off-screen
  let io: IntersectionObserver | null = null
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        isVisible = entry.isIntersecting
        if (isVisible) startLoop()
        else stopLoop()
      },
      { threshold: 0.02 }
    )
    io.observe(el)
  }

  const onVisibilityChange = () => {
    if (document.hidden) stopLoop()
    else startLoop()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  const onResize = () => {
    if (!containerRef.value) return
    const { width, height } = getSize()
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
  }
  window.addEventListener('resize', onResize)

  startLoop()

  cleanupFn = () => {
    stopLoop()
    io?.disconnect()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('resize', onResize)
    el.removeEventListener('pointermove', updatePointerFromEvent)
    el.removeEventListener('pointerleave', onPointerLeave)
    el.removeEventListener('click', onCanvasClick)

    arcGeo.dispose()
    arcMat.dispose()
    arcWireGeo.dispose()
    arcWireMat.dispose()
    icoGeo.dispose()
    icoMat.dispose()
    coreGeo.dispose()
    coreMat.dispose()
    particleGeo.dispose()
    spriteTex.dispose()
    particleMat.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode === el) {
      el.removeChild(renderer.domElement)
    }
  }
})

onBeforeUnmount(() => {
  cleanupFn?.()
  cleanupFn = null
  triggerExplosionFn = null
})
</script>

<template>
  <div class="relative w-full h-[360px] sm:h-[430px] lg:h-[500px] border-2 border-ink bg-paper shadow-brutal-lg overflow-hidden select-none">
    <!-- Top Neo-Brutalist Window Bar -->
    <div class="absolute top-0 inset-x-0 z-10 h-9 px-3 bg-ink text-paper flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-coral border border-paper/40"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-yellow border border-paper/40"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-cyan border border-paper/40"></span>
        <span class="ml-2">ARC-REACTOR // PARTIKEL 1.800</span>
      </div>
      <span class="hidden sm:inline text-yellow">WEBGL AKTIF</span>
    </div>

    <!-- Static Fallback if WebGL unavailable or prefers-reduced-motion -->
    <div v-if="useStaticFallback" class="w-full h-full pt-9 flex items-center justify-center bg-lab-grid p-4">
      <img
        src="/hero-fallback.svg"
        alt="Ilustrasi geometris Arc Lab Studio"
        width="640"
        height="520"
        class="w-full h-full object-contain"
      />
    </div>

    <!-- Interactive Three.js Canvas Stage -->
    <div
      v-else
      ref="containerRef"
      data-cursor-grow
      class="w-full h-full pt-9 bg-lab-grid cursor-pointer"
      role="img"
      aria-label="Simulasi 3D interaktif Arc Lab: gerakkan kursor untuk menolak partikel atau klik untuk ledakan warna"
    ></div>

    <!-- Bottom Interactive HUD Pill -->
    <div v-if="!useStaticFallback" class="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      <span class="bg-paper/95 border-2 border-ink px-2.5 py-1 font-mono text-[11px] font-semibold shadow-brutal-sm">
        GERAKKAN KURSOR · KLIK UNTUK LEDAKAN
      </span>
      <button
        type="button"
        class="pointer-events-auto bg-yellow hover:bg-coral hover:text-paper border-2 border-ink px-3 py-1 font-mono text-[11px] font-bold uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-colors"
        @click.stop="handleManualExplosion"
      >
        Ledakkan! <span v-if="explosionCount > 0">({{ explosionCount }})</span>
      </button>
    </div>
  </div>
</template>
