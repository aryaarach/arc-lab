type ThreeLib = typeof import('three')

export interface QualityProfile {
  isLowEnd: boolean
  pixelRatio: number
  shadowMapSize: number
  allowTransmission: boolean
}

export interface StudioStageContext {
  renderer: import('three').WebGLRenderer
  scene: import('three').Scene
  camera: import('three').PerspectiveCamera
  cycloramaMesh: import('three').Mesh
  shadowFloorMesh: import('three').Mesh
  blobTexture: import('three').CanvasTexture
  keyLight: import('three').DirectionalLight
  quality: QualityProfile
  setBackdropColor: (hex: string) => void
  resizeStage: (width: number, height: number) => void
  disposeStage: () => void
}

export function detectQualityProfile(renderer?: import('three').WebGLRenderer): QualityProfile {
  if (typeof window === 'undefined') {
    return { isLowEnd: false, pixelRatio: 1, shadowMapSize: 1024, allowTransmission: false }
  }
  const lowCores = typeof navigator !== 'undefined' && !!navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
  const smallScreen = window.innerWidth < 768
  const noWebGL2 = renderer ? !renderer.capabilities.isWebGL2 : false
  const isLowEnd = lowCores || smallScreen || noWebGL2

  return {
    isLowEnd,
    pixelRatio: Math.min(window.devicePixelRatio || 1, isLowEnd ? 1.5 : 2),
    shadowMapSize: isLowEnd ? 1024 : 2048,
    allowTransmission: !isLowEnd
  }
}

function createBlobShadowTexture(THREE: ThreeLib): import('three').CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62)
    g.addColorStop(0, 'rgba(10, 10, 14, 0.85)')
    g.addColorStop(0.45, 'rgba(10, 10, 14, 0.38)')
    g.addColorStop(1, 'rgba(10, 10, 14, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.userData.sharedResource = true
  return tex
}

export function createContactBlobMesh(
  THREE: ThreeLib,
  blobTexture: import('three').CanvasTexture,
  rx = 0.72,
  rz = 0.56,
  opacity = 0.35
): import('three').Mesh {
  const geo = new THREE.PlaneGeometry(rx * 2, rz * 2)
  geo.rotateX(-Math.PI * 0.5)
  const mat = new THREE.MeshBasicMaterial({
    map: blobTexture,
    transparent: true,
    opacity,
    depthWrite: false
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = 0.003
  mesh.renderOrder = 1
  return mesh
}

export function createCanvasLabelTexture(
  THREE: ThreeLib,
  renderer: import('three').WebGLRenderer,
  canvas: HTMLCanvasElement
): import('three').CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4)
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

/**
 * Seamless studio cyclorama sweep: floor plane curving via Bezier profile into a tall vertical back wall.
 * Built from a single ExtrudeGeometry mesh with smooth normals and no visible seam.
 */
function buildCycloramaMesh(
  THREE: ThreeLib,
  initialHex: string,
  sweepWidth = 30
): { mesh: import('three').Mesh; material: import('three').MeshStandardMaterial } {
  // Side profile in XY (X = studio Z from front +8 to back -4.2, Y = studio height 0 to +11)
  const t = 0.08 // thin structural backing thickness
  const shape = new THREE.Shape()
  shape.moveTo(8.5, 0)
  shape.lineTo(-1.3, 0)
  shape.bezierCurveTo(-3.1, 0, -4.2, 1.1, -4.2, 2.9)
  shape.lineTo(-4.2, 11.5)
  shape.lineTo(-4.2 - t, 11.5)
  shape.lineTo(-4.2 - t, 2.9)
  shape.bezierCurveTo(-4.2 - t, 0.95, -3.2, -t, -1.3, -t)
  shape.lineTo(8.5, -t)
  shape.closePath()

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: sweepWidth,
    bevelEnabled: false,
    curveSegments: 32,
    steps: 1
  })
  // Center along extrusion depth and orient so profile X -> +Z and extrusion Z -> X
  geo.translate(0, 0, -sweepWidth * 0.5)
  geo.rotateY(-Math.PI * 0.5)
  geo.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialHex),
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.35
  })

  const mesh = new THREE.Mesh(geo, material)
  mesh.receiveShadow = true
  return { mesh, material }
}

export function setupStudioStage(
  THREE: ThreeLib,
  RoomEnvironmentClass: new () => import('three').Scene,
  containerEl: HTMLElement,
  initialBackdropHex: string,
  fov = 30
): StudioStageContext {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  })

  const quality = detectQualityProfile(renderer)
  const w = Math.max(containerEl.clientWidth, 280)
  const h = Math.max(containerEl.clientHeight, 320)

  renderer.setPixelRatio(quality.pixelRatio)
  renderer.setSize(w, h)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  containerEl.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const bgCol = new THREE.Color(initialBackdropHex)
  scene.background = bgCol
  scene.fog = new THREE.Fog(bgCol, 14, 28)

  // PMREM RoomEnvironment for realistic specular reflections on glass, metal, and clearcoat
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const envRoom = new RoomEnvironmentClass()
  const envRT = pmrem.fromScene(envRoom, 0.04)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.95
  pmrem.dispose()
  disposeObjectTree(envRoom)

  // Longer studio lens PerspectiveCamera (fov 28-32)
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 60)

  // Three-point studio lighting
  const keyLight = new THREE.DirectionalLight(0xfffbf4, 2.05)
  keyLight.position.set(4.2, 6.8, 5.0)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize)
  keyLight.shadow.radius = 4
  keyLight.shadow.bias = -0.0004
  keyLight.shadow.normalBias = 0.02
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 22
  keyLight.shadow.camera.left = -6.5
  keyLight.shadow.camera.right = 6.5
  keyLight.shadow.camera.top = 5.5
  keyLight.shadow.camera.bottom = -4.5

  const fillLight = new THREE.DirectionalLight(0xf5f7ff, 0.42)
  fillLight.position.set(-5.0, 3.2, 4.0)
  fillLight.castShadow = false

  const rimLight = new THREE.DirectionalLight(0xd6e9ff, 0.82)
  rimLight.position.set(-2.4, 4.6, -5.2)
  rimLight.castShadow = false

  scene.add(keyLight, fillLight, rimLight)

  // Seamless Cyclorama Sweep
  const { mesh: cycloramaMesh, material: cycloramaMat } = buildCycloramaMesh(THREE, initialBackdropHex, 32)
  scene.add(cycloramaMesh)

  // Soft ShadowMaterial contact catcher plane on floor
  const shadowFloorGeo = new THREE.PlaneGeometry(18, 12)
  shadowFloorGeo.rotateX(-Math.PI * 0.5)
  const shadowFloorMat = new THREE.ShadowMaterial({ opacity: 0.18 })
  const shadowFloorMesh = new THREE.Mesh(shadowFloorGeo, shadowFloorMat)
  shadowFloorMesh.position.y = 0.0015
  shadowFloorMesh.receiveShadow = true
  scene.add(shadowFloorMesh)

  const blobTexture = createBlobShadowTexture(THREE)

  const setBackdropColor = (hex: string) => {
    const c = new THREE.Color(hex)
    cycloramaMat.color.copy(c)
    scene.background = c
    if (scene.fog) scene.fog.color.copy(c)
    // Adjust shadow receiver strength subtly for dark studio backdrop
    const isDark = c.r * 0.299 + c.g * 0.587 + c.b * 0.114 < 0.2
    shadowFloorMat.opacity = isDark ? 0.42 : 0.18
  }
  setBackdropColor(initialBackdropHex)

  const resizeStage = (width: number, height: number) => {
    const safeW = Math.max(width, 260)
    const safeH = Math.max(height, 260)
    camera.aspect = safeW / safeH
    camera.updateProjectionMatrix()
    const refreshed = detectQualityProfile(renderer)
    renderer.setPixelRatio(refreshed.pixelRatio)
    renderer.setSize(safeW, safeH)
  }

  const disposeStage = () => {
    cycloramaMesh.geometry.dispose()
    cycloramaMat.dispose()
    shadowFloorGeo.dispose()
    shadowFloorMat.dispose()
    blobTexture.dispose()
    envRT.dispose()
    keyLight.shadow.map?.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    if (renderer.domElement.parentNode === containerEl) {
      containerEl.removeChild(renderer.domElement)
    }
  }

  return {
    renderer,
    scene,
    camera,
    cycloramaMesh,
    shadowFloorMesh,
    blobTexture,
    keyLight,
    quality,
    setBackdropColor,
    resizeStage,
    disposeStage
  }
}

export function disposeObjectTree(root: import('three').Object3D | null | undefined) {
  if (!root) return
  root.traverse((obj) => {
    const mesh = obj as import('three').Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) {
      if (!m) continue
      const phys = m as import('three').MeshPhysicalMaterial
      const maps = [phys.map, phys.bumpMap, phys.normalMap, phys.roughnessMap, phys.alphaMap]
      for (const tex of maps) {
        if (tex && !tex.userData?.sharedResource && !tex.userData?.sharedTexture) {
          tex.dispose()
        }
      }
      m.dispose()
    }
  })
}

/**
 * Renders a 2x resolution snapshot in the current frame, captures PNG via toBlob,
 * restores renderer size immediately, and downloads the PNG.
 */
export async function captureStagePng(
  renderer: import('three').WebGLRenderer,
  scene: import('three').Scene,
  camera: import('three').PerspectiveCamera,
  filename = 'arc-lab-studio.png'
): Promise<void> {
  if (typeof window === 'undefined') return
  const canvas = renderer.domElement
  const cssW = Math.max(canvas.clientWidth || 640, 320)
  const cssH = Math.max(canvas.clientHeight || 480, 240)
  const prevPixelRatio = renderer.getPixelRatio()

  const scale = Math.min(2, 3840 / Math.max(cssW, cssH))
  renderer.setPixelRatio(1)
  renderer.setSize(Math.round(cssW * scale), Math.round(cssH * scale), false)
  renderer.render(scene, camera)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))

  // Restore viewport immediately
  renderer.setPixelRatio(prevPixelRatio)
  renderer.setSize(cssW, cssH, true)
  renderer.render(scene, camera)

  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
