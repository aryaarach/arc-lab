import type { FinishType, ProductId } from '~/composables/useBrandState'

type ThreeLib = typeof import('three')

export interface MockupBuildOptions {
  allowTransmission?: boolean
}

export interface MockupBuildResult {
  group: import('three').Group
  labelMaterials: import('three').MeshPhysicalMaterial[]
  bounds: { width: number; height: number; depth: number }
}

export type MockupBuilderFn = (
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType,
  options?: MockupBuildOptions
) => MockupBuildResult

let cachedKraftBump: import('three').CanvasTexture | null = null
let cachedFabricNormal: import('three').CanvasTexture | null = null

function getKraftBumpMap(THREE: ThreeLib): import('three').CanvasTexture {
  if (cachedKraftBump) return cachedKraftBump
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  if (ctx) {
    const img = ctx.createImageData(256, 256)
    const d = img.data
    let s = 918273
    for (let i = 0; i < d.length; i += 4) {
      s = (s * 16807) % 2147483647
      const v = 96 + (s % 90)
      d[i] = v
      d[i + 1] = v
      d[i + 2] = v
      d[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    // Subtle cellulose fibers
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    for (let k = 0; k < 140; k++) {
      s = (s * 16807) % 2147483647
      const x = s % 256
      const y = (s >> 8) % 256
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + ((s % 14) - 7), y + ((s % 10) - 5))
      ctx.stroke()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  tex.userData.sharedResource = true
  cachedKraftBump = tex
  return tex
}

function getCanvasWeaveNormalMap(THREE: ThreeLib): import('three').CanvasTexture {
  if (cachedFabricNormal) return cachedFabricNormal
  const size = 128
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  if (ctx) {
    const img = ctx.createImageData(size, size)
    const d = img.data
    const cell = 8
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x % cell) / cell
        const v = (y % cell) / cell
        const checker = ((Math.floor(x / cell) + Math.floor(y / cell)) & 1) === 0
        // Tangent-space normal encoding around (128, 128, 255)
        let nx = 0
        let ny = 0
        if (checker) {
          nx = Math.cos(u * Math.PI) * 0.45
          ny = (v - 0.5) * 0.15
        } else {
          nx = (u - 0.5) * 0.15
          ny = Math.cos(v * Math.PI) * 0.45
        }
        const idx = (y * size + x) * 4
        d[idx] = Math.round((nx * 0.5 + 0.5) * 255)
        d[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255)
        d[idx + 2] = 235
        d[idx + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(14, 14)
  tex.userData.sharedResource = true
  cachedFabricNormal = tex
  return tex
}

function createPhysicalFinishMaterial(
  THREE: ThreeLib,
  finish: FinishType,
  baseColorHex: string,
  labelTex?: import('three').Texture
): import('three').MeshPhysicalMaterial {
  if (finish === 'Glossy') {
    return new THREE.MeshPhysicalMaterial({
      color: labelTex ? 0xffffff : new THREE.Color(baseColorHex),
      map: labelTex || null,
      roughness: 0.12,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.05
    })
  }
  if (finish === 'Kraft') {
    const bump = getKraftBumpMap(THREE)
    return new THREE.MeshPhysicalMaterial({
      color: labelTex ? new THREE.Color('#E3C89E') : new THREE.Color('#C9A878'),
      map: labelTex || null,
      roughness: 0.9,
      metalness: 0.0,
      clearcoat: 0.0,
      bumpMap: bump,
      bumpScale: 0.014,
      envMapIntensity: 0.65
    })
  }
  // Matte
  return new THREE.MeshPhysicalMaterial({
    color: labelTex ? 0xffffff : new THREE.Color(baseColorHex),
    map: labelTex || null,
    roughness: 0.7,
    metalness: 0.0,
    clearcoat: 0.0,
    sheen: 0.3,
    sheenRoughness: 0.65,
    sheenColor: new THREE.Color(0xffffff),
    envMapIntensity: 0.85
  })
}

function createGlassMaterial(
  THREE: ThreeLib,
  allowTransmission = true,
  tintHex = 0xf8fcff
): import('three').MeshPhysicalMaterial {
  if (allowTransmission) {
    return new THREE.MeshPhysicalMaterial({
      color: tintHex,
      transmission: 0.9,
      thickness: 0.4,
      ior: 1.5,
      roughness: 0.05,
      metalness: 0.0,
      envMapIntensity: 1.15,
      transparent: true
    })
  }
  // Low-end fallback without costly screen-space transmission pass
  return new THREE.MeshPhysicalMaterial({
    color: tintHex,
    transparent: true,
    opacity: 0.35,
    roughness: 0.06,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.15
  })
}

function createMetalMaterial(THREE: ThreeLib, hex = 0xdadce2, roughness = 0.25): import('three').MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: hex,
    metalness: 1.0,
    roughness,
    envMapIntensity: 1.0
  })
}

function makeRoundedRectShape(THREE: ThreeLib, w: number, h: number, r: number): import('three').Shape {
  const s = new THREE.Shape()
  const x = -w * 0.5
  const y = -h * 0.5
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

function enableShadows(mesh: import('three').Mesh, cast = true, receive = true) {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
}

/**
 * 1. Box kemasan — rounded box via ExtrudeGeometry bevel + top tuck flap + crisp front/back label faces
 */
export function buildBoxMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType
): MockupBuildResult {
  const group = new THREE.Group()
  const W = 1.08
  const H = 1.48
  const D = 0.66
  const bevel = 0.024

  // Extrude vertical box body from rounded base footprint
  const footprint = makeRoundedRectShape(THREE, W - bevel * 2, D - bevel * 2, 0.032)
  const bodyGeo = new THREE.ExtrudeGeometry(footprint, {
    depth: H - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10
  })
  bodyGeo.rotateX(-Math.PI * 0.5)
  bodyGeo.translate(0, bevel, 0)

  const bodyColor = finish === 'Kraft' ? '#C9A878' : '#F4EFE6'
  const bodyMat = createPhysicalFinishMaterial(THREE, finish, bodyColor)
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
  enableShadows(bodyMesh)

  // Top tuck flap lid cap + subtle shadow seam
  const flapShape = makeRoundedRectShape(THREE, W - 0.03, D - 0.03, 0.025)
  const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2
  })
  flapGeo.rotateX(-Math.PI * 0.5)
  flapGeo.translate(0, H + 0.002, 0)
  const accentMat = createPhysicalFinishMaterial(THREE, finish, colorHex)
  const flapMesh = new THREE.Mesh(flapGeo, accentMat)
  enableShadows(flapMesh)

  // Front & back flush printed label panels (undistorted 1:1 UVs)
  const labelMat = createPhysicalFinishMaterial(THREE, finish, '#FFFFFF', texture)
  const labelGeo = new THREE.PlaneGeometry(W - 0.09, H - 0.14)
  const frontLabel = new THREE.Mesh(labelGeo, labelMat)
  frontLabel.position.set(0, H * 0.5, D * 0.5 + 0.002)
  enableShadows(frontLabel, false, true)

  const backLabel = new THREE.Mesh(labelGeo.clone(), labelMat)
  backLabel.rotation.y = Math.PI
  backLabel.position.set(0, H * 0.5, -D * 0.5 - 0.002)
  enableShadows(backLabel, false, true)

  group.add(bodyMesh, flapMesh, frontLabel, backLabel)
  return { group, labelMaterials: [labelMat], bounds: { width: W, height: H + 0.03, depth: D } }
}

/**
 * 2. Kaleng — LatheGeometry 48-seg body with rolled rim, aluminum top, pull tab with ring
 */
export function buildCanMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  _colorHex: string,
  finish: FinishType
): MockupBuildResult {
  const group = new THREE.Group()
  const R = 0.43
  const H = 1.48

  // 48-seg LatheGeometry aluminum can silhouette
  const pts = [
    new THREE.Vector2(0.0, 0.025),
    new THREE.Vector2(0.28, 0.025),
    new THREE.Vector2(0.34, 0.0),
    new THREE.Vector2(0.37, 0.03),
    new THREE.Vector2(R, 0.1),
    new THREE.Vector2(R, 1.3),
    new THREE.Vector2(0.37, 1.43),
    new THREE.Vector2(0.388, 1.455),
    new THREE.Vector2(0.375, H),
    new THREE.Vector2(0.355, H - 0.025),
    new THREE.Vector2(0.0, H - 0.025)
  ]
  const canGeo = new THREE.LatheGeometry(pts, 48)
  const metalMat = createMetalMaterial(THREE, 0xdce0e6, 0.24)
  const canMesh = new THREE.Mesh(canGeo, metalMat)
  enableShadows(canMesh)

  // Printed cylindrical wrap sleeve (48 segments, rotated so u=0.5 faces +Z)
  const sleeveGeo = new THREE.CylinderGeometry(R + 0.0025, R + 0.0025, 1.18, 48, 1, true)
  sleeveGeo.rotateY(Math.PI)
  const labelMat = createPhysicalFinishMaterial(THREE, finish, '#FFFFFF', texture)
  if (finish === 'Glossy') {
    labelMat.metalness = 0.18
  }
  const sleeveMesh = new THREE.Mesh(sleeveGeo, labelMat)
  sleeveMesh.position.y = 0.69
  enableShadows(sleeveMesh, false, true)

  // Pull tab ring + lever + rivet
  const tabRingGeo = new THREE.TorusGeometry(0.082, 0.015, 12, 32)
  tabRingGeo.rotateX(Math.PI * 0.5)
  const tabRing = new THREE.Mesh(tabRingGeo, metalMat)
  tabRing.position.set(0, H - 0.012, -0.05)

  const leverGeo = new THREE.BoxGeometry(0.09, 0.014, 0.11)
  const lever = new THREE.Mesh(leverGeo, metalMat)
  lever.position.set(0, H - 0.012, 0.04)

  const rivetGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.022, 20)
  const rivet = new THREE.Mesh(rivetGeo, metalMat)
  rivet.position.set(0, H - 0.01, 0.01)

  group.add(canMesh, sleeveMesh, tabRing, lever, rivet)
  return { group, labelMaterials: [labelMat], bounds: { width: R * 2, height: H, depth: R * 2 } }
}

/**
 * 3. Cup minuman — tapered cup, domed lid with sip hole, straw
 */
export function buildCupMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType
): MockupBuildResult {
  const group = new THREE.Group()
  const rTop = 0.47
  const rBot = 0.32
  const cupH = 1.28

  // Cup base structure
  const cupBodyMat = createPhysicalFinishMaterial(THREE, finish, finish === 'Kraft' ? '#C9A878' : '#F6F3EC')
  const cupGeo = new THREE.CylinderGeometry(rTop, rBot, cupH, 48, 1, false)
  const cupMesh = new THREE.Mesh(cupGeo, cupBodyMat)
  cupMesh.position.y = cupH * 0.5
  enableShadows(cupMesh)

  // Printed wrap sleeve band around middle of tapered cup
  const bandH = 0.84
  const bandCenterY = cupH * 0.52
  const tTop = (bandCenterY + bandH * 0.5) / cupH
  const tBot = (bandCenterY - bandH * 0.5) / cupH
  const bandRTop = rBot + (rTop - rBot) * tTop + 0.003
  const bandRBot = rBot + (rTop - rBot) * tBot + 0.003

  const bandGeo = new THREE.CylinderGeometry(bandRTop, bandRBot, bandH, 48, 1, true)
  bandGeo.rotateY(Math.PI)
  const labelMat = createPhysicalFinishMaterial(THREE, finish, '#FFFFFF', texture)
  const bandMesh = new THREE.Mesh(bandGeo, labelMat)
  bandMesh.position.y = bandCenterY
  enableShadows(bandMesh, false, true)

  // Domed translucent lid via 48-seg LatheGeometry
  const lidPts = [
    new THREE.Vector2(0.055, 0.24),
    new THREE.Vector2(0.22, 0.235),
    new THREE.Vector2(0.39, 0.16),
    new THREE.Vector2(0.46, 0.045),
    new THREE.Vector2(0.495, 0.035),
    new THREE.Vector2(0.495, -0.025),
    new THREE.Vector2(0.472, -0.025)
  ]
  const lidGeo = new THREE.LatheGeometry(lidPts, 48)
  const lidMat = new THREE.MeshPhysicalMaterial({
    color: 0xfafcff,
    transparent: true,
    opacity: 0.58,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  })
  const lidMesh = new THREE.Mesh(lidGeo, lidMat)
  lidMesh.position.y = cupH
  enableShadows(lidMesh, true, false)

  // Sip hole dark accent on lid rim
  const sipGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.02, 20)
  const sipMat = new THREE.MeshPhysicalMaterial({ color: 0x18181c, roughness: 0.5 })
  const sipMesh = new THREE.Mesh(sipGeo, sipMat)
  sipMesh.position.set(0, cupH + 0.19, 0.28)
  sipMesh.rotation.x = 0.35

  // Reusable straw emerging through dome center
  const strawGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.68, 24)
  const strawMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.22,
    clearcoat: 0.6
  })
  const strawMesh = new THREE.Mesh(strawGeo, strawMat)
  strawMesh.position.set(0.03, cupH + 0.32, -0.02)
  strawMesh.rotation.z = -0.11
  enableShadows(strawMesh)

  group.add(cupMesh, bandMesh, lidMesh, sipMesh, strawMesh)
  return { group, labelMaterials: [labelMat], bounds: { width: rTop * 2, height: cupH + 0.58, depth: rTop * 2 } }
}

/**
 * 4. Botol — LatheGeometry glass bottle + smaller inner liquid LatheGeometry + cap + wrapped label
 */
export function buildBottleMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType,
  options?: MockupBuildOptions
): MockupBuildResult {
  const group = new THREE.Group()
  const R = 0.41

  // Outer Glass Bottle (1 transmission mesh)
  const glassPts = [
    new THREE.Vector2(0.0, 0.03),
    new THREE.Vector2(0.28, 0.03),
    new THREE.Vector2(0.36, 0.0),
    new THREE.Vector2(R, 0.07),
    new THREE.Vector2(R, 1.04),
    new THREE.Vector2(0.37, 1.18),
    new THREE.Vector2(0.21, 1.36),
    new THREE.Vector2(0.155, 1.48),
    new THREE.Vector2(0.155, 1.72),
    new THREE.Vector2(0.172, 1.74),
    new THREE.Vector2(0.145, 1.75)
  ]
  const glassGeo = new THREE.LatheGeometry(glassPts, 48)
  const glassMat = createGlassMaterial(THREE, options?.allowTransmission ?? true, 0xf7fbff)
  const glassMesh = new THREE.Mesh(glassGeo, glassMat)
  enableShadows(glassMesh, true, true)

  // Inner Liquid LatheGeometry (slightly smaller)
  const liqPts = [
    new THREE.Vector2(0.0, 0.055),
    new THREE.Vector2(0.365, 0.055),
    new THREE.Vector2(0.372, 1.02),
    new THREE.Vector2(0.32, 1.16),
    new THREE.Vector2(0.0, 1.16)
  ]
  const liqGeo = new THREE.LatheGeometry(liqPts, 48)
  const liqMat = new THREE.MeshPhysicalMaterial({
    color: 0x381b0e,
    roughness: 0.14,
    clearcoat: 0.8
  })
  const liqMesh = new THREE.Mesh(liqGeo, liqMat)

  // Screw Cap
  const capGeo = new THREE.CylinderGeometry(0.178, 0.178, 0.22, 48)
  const capMat = new THREE.MeshPhysicalMaterial({
    color: finish === 'Glossy' ? new THREE.Color(colorHex) : new THREE.Color('#1B1B20'),
    roughness: 0.32,
    metalness: 0.25,
    clearcoat: 0.4
  })
  const capMesh = new THREE.Mesh(capGeo, capMat)
  capMesh.position.y = 1.78
  enableShadows(capMesh)

  // Wrap-around body label
  const labelGeo = new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.78, 48, 1, true)
  labelGeo.rotateY(Math.PI)
  const labelMat = createPhysicalFinishMaterial(THREE, finish, '#FFFFFF', texture)
  const labelMesh = new THREE.Mesh(labelGeo, labelMat)
  labelMesh.position.y = 0.56
  enableShadows(labelMesh, false, true)

  group.add(liqMesh, glassMesh, capMesh, labelMesh)
  return { group, labelMaterials: [labelMat], bounds: { width: R * 2, height: 1.89, depth: R * 2 } }
}

/**
 * 5. Toples / jar — LatheGeometry glass jar + inner gourmet fill + metal or wooden lid + belly label
 */
export function buildJarMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType,
  options?: MockupBuildOptions
): MockupBuildResult {
  const group = new THREE.Group()
  const R = 0.51

  // Glass Jar (1 transmission mesh)
  const jarPts = [
    new THREE.Vector2(0.0, 0.025),
    new THREE.Vector2(0.38, 0.0),
    new THREE.Vector2(R, 0.08),
    new THREE.Vector2(R, 0.92),
    new THREE.Vector2(0.45, 1.02),
    new THREE.Vector2(0.45, 1.12)
  ]
  const jarGeo = new THREE.LatheGeometry(jarPts, 48)
  const glassMat = createGlassMaterial(THREE, options?.allowTransmission ?? true, 0xfafcff)
  const jarMesh = new THREE.Mesh(jarGeo, glassMat)
  enableShadows(jarMesh, true, true)

  // Inner artisanal contents (jam / sambal / cream)
  const fillGeo = new THREE.CylinderGeometry(0.47, 0.465, 0.78, 48)
  const baseFillCol = new THREE.Color(colorHex).lerp(new THREE.Color('#5A2518'), 0.45)
  const fillMat = new THREE.MeshPhysicalMaterial({
    color: baseFillCol,
    roughness: 0.42,
    clearcoat: 0.35
  })
  const fillMesh = new THREE.Mesh(fillGeo, fillMat)
  fillMesh.position.y = 0.44

  // Lid: brushed champagne brass or warm turned wood on Kraft
  const lidPts = [
    new THREE.Vector2(0.465, 0.0),
    new THREE.Vector2(0.485, 0.01),
    new THREE.Vector2(0.485, 0.17),
    new THREE.Vector2(0.465, 0.19),
    new THREE.Vector2(0.0, 0.19)
  ]
  const lidGeo = new THREE.LatheGeometry(lidPts, 48)
  const lidMat =
    finish === 'Kraft'
      ? new THREE.MeshPhysicalMaterial({
          color: 0xb68b59,
          roughness: 0.78,
          bumpMap: getKraftBumpMap(THREE),
          bumpScale: 0.018
        })
      : createMetalMaterial(THREE, 0xd7be82, 0.26)
  const lidMesh = new THREE.Mesh(lidGeo, lidMat)
  lidMesh.position.y = 1.02
  enableShadows(lidMesh)

  // Belly wrap label
  const labelGeo = new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.58, 48, 1, true)
  labelGeo.rotateY(Math.PI)
  const labelMat = createPhysicalFinishMaterial(THREE, finish, '#FFFFFF', texture)
  const labelMesh = new THREE.Mesh(labelGeo, labelMat)
  labelMesh.position.y = 0.5
  enableShadows(labelMesh, false, true)

  group.add(fillMesh, jarMesh, lidMesh, labelMesh)
  return { group, labelMaterials: [labelMat], bounds: { width: R * 2, height: 1.22, depth: R * 2 } }
}

/**
 * 6. Pouch standing — subdivided PlaneGeometry front & back with sine bulge, crimped top/bottom, zip strip, tear notch
 */
export function buildPouchMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType
): MockupBuildResult {
  const group = new THREE.Group()
  const W = 1.18
  const H = 1.66

  function createBulgedPouchHalf(isFront: boolean): import('three').BufferGeometry {
    const geo = new THREE.PlaneGeometry(W, H, 28, 36)
    const pos = geo.attributes.position as import('three').BufferAttribute
    const sign = isFront ? 1 : -1

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i)
      const yRaw = pos.getY(i) // -H/2 .. +H/2
      const v = (yRaw + H * 0.5) / H // 0 (bottom) .. 1 (top)
      const u = (x + W * 0.5) / W // 0 .. 1

      // Slight graceful taper narrower toward top header
      const widthScale = 1.0 - 0.05 * v + 0.03 * Math.sin(v * Math.PI)
      x *= widthScale

      // Tear notches on left & right heat-seal edge at v = 0.90
      if (Math.abs(v - 0.9) < 0.016 && (u < 0.04 || u > 0.96)) {
        x *= 0.94
      }

      // Sine belly bulge: wide gusset near bottom-middle, pinched flat at side seams and top seal
      const horizPinch = Math.pow(Math.sin(Math.min(1, Math.max(0, u)) * Math.PI), 0.72)
      let vertBulge = 0
      if (v < 0.85) {
        // Plump standing bottom & mid belly tapering cleanly to zip line at v=0.85
        vertBulge = Math.sin((v / 0.85) * Math.PI * 0.92 + 0.08)
      }
      // Subtle crimp rib texture on top seal band
      const crimp = v > 0.88 ? Math.sin(v * 180) * 0.002 : 0
      const zipBump = Math.exp(-Math.pow((v - 0.845) / 0.012, 2)) * 0.012

      const z = sign * (0.008 + 0.24 * horizPinch * vertBulge + zipBump + crimp)
      pos.setXYZ(i, x, yRaw + H * 0.5, z)
    }

    if (!isFront) {
      // Flip face winding for back half
      geo.rotateY(Math.PI)
      // Restore X symmetry after Y flip
    }
    geo.computeVertexNormals()
    return geo
  }

  const frontGeo = createBulgedPouchHalf(true)
  // Back half built by mirroring Z & winding cleanly
  const backGeo = new THREE.PlaneGeometry(W, H, 28, 36)
  backGeo.rotateY(Math.PI)
  {
    const pos = backGeo.attributes.position as import('three').BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i)
      const yRaw = pos.getY(i)
      const v = (yRaw + H * 0.5) / H
      const u = (x + W * 0.5) / W
      x *= 1.0 - 0.05 * v + 0.03 * Math.sin(v * Math.PI)
      if (Math.abs(v - 0.9) < 0.016 && (u < 0.04 || u > 0.96)) x *= 0.94
      const horizPinch = Math.pow(Math.sin(Math.min(1, Math.max(0, u)) * Math.PI), 0.72)
      const vertBulge = v < 0.85 ? Math.sin((v / 0.85) * Math.PI * 0.92 + 0.08) : 0
      const zipBump = Math.exp(-Math.pow((v - 0.845) / 0.012, 2)) * 0.012
      const z = -(0.008 + 0.24 * horizPinch * vertBulge + zipBump)
      pos.setXYZ(i, x, yRaw + H * 0.5, z)
    }
    backGeo.computeVertexNormals()
  }

  const labelMat = createPhysicalFinishMaterial(THREE, finish, '#FFFFFF', texture)
  const backColor = finish === 'Kraft' ? '#C9A878' : '#EFEAE0'
  const pouchBackMat = createPhysicalFinishMaterial(THREE, finish, backColor)

  const frontMesh = new THREE.Mesh(frontGeo, labelMat)
  const backMesh = new THREE.Mesh(backGeo, pouchBackMat)
  enableShadows(frontMesh)
  enableShadows(backMesh)

  // Bottom gusset fold seal
  const bottomGussetGeo = new THREE.CylinderGeometry(0.16, 0.16, W * 0.82, 24, 1, false, 0, Math.PI)
  bottomGussetGeo.rotateZ(Math.PI * 0.5)
  bottomGussetGeo.scale(1, 0.35, 1)
  const bottomGusset = new THREE.Mesh(bottomGussetGeo, pouchBackMat)
  bottomGusset.position.y = 0.05

  // Subtle accent zip strip highlight on front header
  const zipGeo = new THREE.BoxGeometry(W * 0.88, 0.016, 0.026)
  const zipMat = createPhysicalFinishMaterial(THREE, finish, colorHex)
  const zipMesh = new THREE.Mesh(zipGeo, zipMat)
  zipMesh.position.set(0, H * 0.845, 0.006)

  group.add(frontMesh, backMesh, bottomGusset, zipMesh)
  return { group, labelMaterials: [labelMat], bounds: { width: W, height: H, depth: 0.5 } }
}

/**
 * 7. Tote bag — ExtrudeGeometry body with fabric weave normalMap, 2 TubeGeometry handles, stitched hem line
 */
export function buildToteMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType
): MockupBuildResult {
  const group = new THREE.Group()
  const W = 1.24
  const H = 1.34
  const D = 0.14
  const weaveNormal = getCanvasWeaveNormalMap(THREE)

  const fabricColor = finish === 'Kraft' ? '#CBB089' : '#EFE9DC'
  const fabricMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(fabricColor),
    roughness: 0.95,
    metalness: 0.0,
    sheen: 1.0,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xfffcf5),
    normalMap: weaveNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    envMapIntensity: 0.55
  })

  const bagShape = makeRoundedRectShape(THREE, W, H, 0.06)
  const bagGeo = new THREE.ExtrudeGeometry(bagShape, {
    depth: D,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 4
  })
  bagGeo.translate(0, H * 0.5 + 0.03, -D * 0.5)
  const bagMesh = new THREE.Mesh(bagGeo, fabricMat)
  enableShadows(bagMesh)

  // Screen-printed front artwork panel inheriting the woven canvas normalMap
  const labelMat = new THREE.MeshPhysicalMaterial({
    color: finish === 'Kraft' ? new THREE.Color('#EAD5B4') : 0xffffff,
    map: texture,
    roughness: 0.92,
    sheen: 0.8,
    sheenRoughness: 0.65,
    normalMap: weaveNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    envMapIntensity: 0.55
  })
  const printGeo = new THREE.PlaneGeometry(0.82, 0.82)
  const printMesh = new THREE.Mesh(printGeo, labelMat)
  printMesh.position.set(0, H * 0.49, D * 0.5 + 0.038)
  enableShadows(printMesh, false, true)

  // Stitched top hem collar band
  const hemGeo = new THREE.BoxGeometry(W + 0.05, 0.055, D + 0.072)
  const strapMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.9,
    sheen: 0.9,
    sheenRoughness: 0.6,
    normalMap: weaveNormal,
    normalScale: new THREE.Vector2(0.4, 0.4)
  })
  const hemMesh = new THREE.Mesh(hemGeo, fabricMat)
  hemMesh.position.set(0, H + 0.02, 0)
  enableShadows(hemMesh)

  // 2 TubeGeometry cotton webbing shoulder handles
  function makeHandle(zSign: number) {
    const zOff = zSign * (D * 0.5 + 0.015)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.31, H - 0.02, zOff),
      new THREE.Vector3(-0.33, H + 0.34, zOff * 0.85),
      new THREE.Vector3(0, H + 0.54, zOff * 0.6),
      new THREE.Vector3(0.33, H + 0.34, zOff * 0.85),
      new THREE.Vector3(0.31, H - 0.02, zOff)
    ])
    const tGeo = new THREE.TubeGeometry(curve, 32, 0.028, 12, false)
    const mesh = new THREE.Mesh(tGeo, strapMat)
    enableShadows(mesh)
    return mesh
  }

  group.add(bagMesh, printMesh, hemMesh, makeHandle(1), makeHandle(-1))
  return { group, labelMaterials: [labelMat], bounds: { width: W + 0.06, height: H + 0.56, depth: D + 0.1 } }
}

/**
 * 8. Paper shopping bag — folded top cuff, twisted-paper handles, V-pleated side gussets
 */
export function buildPaperBagMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType
): MockupBuildResult {
  const group = new THREE.Group()
  const W = 1.22
  const H = 1.44
  const D = 0.44

  const basePaperHex = finish === 'Kraft' ? '#C9A878' : '#F3EEE4'
  const sideMat = createPhysicalFinishMaterial(THREE, finish, basePaperHex)
  sideMat.side = THREE.DoubleSide
  const labelMat = createPhysicalFinishMaterial(THREE, finish, '#FFFFFF', texture)

  // Front & back main boards
  const faceGeo = new THREE.BoxGeometry(W, H, 0.014)
  const frontBoard = new THREE.Mesh(faceGeo, [sideMat, sideMat, sideMat, sideMat, labelMat, sideMat])
  frontBoard.position.set(0, H * 0.5, D * 0.5)
  enableShadows(frontBoard)

  const backBoard = new THREE.Mesh(faceGeo.clone(), [sideMat, sideMat, sideMat, sideMat, sideMat, labelMat])
  backBoard.position.set(0, H * 0.5, -D * 0.5)
  enableShadows(backBoard)

  // Inward V-pleated accordion side gussets + bottom board in 1 custom BufferGeometry
  const hw = W * 0.5
  const hd = D * 0.5
  const foldIn = 0.11
  const gussetVerts = new Float32Array([
    // Right gusset front half
    hw, 0, hd, hw - foldIn, 0, 0, hw, H, hd,
    hw - foldIn, 0, 0, hw - foldIn, H, 0, hw, H, hd,
    // Right gusset back half
    hw - foldIn, 0, 0, hw, 0, -hd, hw - foldIn, H, 0,
    hw, 0, -hd, hw, H, -hd, hw - foldIn, H, 0,
    // Left gusset front half
    -hw + foldIn, 0, 0, -hw, 0, hd, -hw + foldIn, H, 0,
    -hw, 0, hd, -hw, H, hd, -hw + foldIn, H, 0,
    // Left gusset back half
    -hw, 0, -hd, -hw + foldIn, 0, 0, -hw, H, -hd,
    -hw + foldIn, 0, 0, -hw + foldIn, H, 0, -hw, H, -hd,
    // Bottom board
    -hw, 0.008, hd, hw, 0.008, hd, hw, 0.008, -hd,
    -hw, 0.008, hd, hw, 0.008, -hd, -hw, 0.008, -hd
  ])
  const gussetGeo = new THREE.BufferGeometry()
  gussetGeo.setAttribute('position', new THREE.BufferAttribute(gussetVerts, 3))
  gussetGeo.computeVertexNormals()
  const gussetMesh = new THREE.Mesh(gussetGeo, sideMat)
  enableShadows(gussetMesh)

  // Folded reinforced top turn-over cuff
  const cuffGeo = new THREE.BoxGeometry(W + 0.012, 0.09, 0.022)
  const cuffMat = createPhysicalFinishMaterial(THREE, finish, colorHex)
  const frontCuff = new THREE.Mesh(cuffGeo, cuffMat)
  frontCuff.position.set(0, H - 0.045, D * 0.5 + 0.005)
  const backCuff = new THREE.Mesh(cuffGeo.clone(), cuffMat)
  backCuff.position.set(0, H - 0.045, -D * 0.5 - 0.005)
  enableShadows(frontCuff)
  enableShadows(backCuff)

  // Twisted-paper cord handles
  const cordMat = new THREE.MeshPhysicalMaterial({
    color: finish === 'Kraft' ? 0xb58f5e : new THREE.Color(colorHex),
    roughness: 0.85,
    bumpMap: getKraftBumpMap(THREE),
    bumpScale: 0.02
  })

  function makeCordHandle(zSign: number) {
    const z = zSign * (D * 0.5 - 0.02)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.27, H - 0.08, z),
      new THREE.Vector3(-0.27, H + 0.24, z),
      new THREE.Vector3(0, H + 0.36, z),
      new THREE.Vector3(0.27, H + 0.24, z),
      new THREE.Vector3(0.27, H - 0.08, z)
    ])
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.02, 10, false), cordMat)
    enableShadows(m)
    return m
  }

  group.add(frontBoard, backBoard, gussetMesh, frontCuff, backCuff, makeCordHandle(1), makeCordHandle(-1))
  return { group, labelMaterials: [labelMat], bounds: { width: W, height: H + 0.38, depth: D } }
}

/**
 * 9. Kartu nama — stack of 5 thin boxes, fanned, thickness visible, front card shows logo and name
 */
export function buildCardMockup(
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType
): MockupBuildResult {
  const group = new THREE.Group()
  const cardW = 1.12
  const cardT = 0.024
  const cardD = 0.64

  const edgeMat = createPhysicalFinishMaterial(THREE, finish, colorHex)
  const backStockMat = createPhysicalFinishMaterial(THREE, finish, finish === 'Kraft' ? '#C9A878' : '#F6F3EC')
  const labelMat = createPhysicalFinishMaterial(THREE, finish, '#FFFFFF', texture)

  const cardMaterials = [edgeMat, edgeMat, labelMat, backStockMat, edgeMat, edgeMat]

  // 4 fanned flat stacked cards with visible painted edges
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.BoxGeometry(cardW, cardT, cardD)
    const card = new THREE.Mesh(geo, cardMaterials)
    card.position.set(-0.06 + i * 0.03, cardT * 0.5 + i * (cardT + 0.002), -0.08 - i * 0.015)
    card.rotation.y = -0.14 + i * 0.085
    enableShadows(card)
    group.add(card)
  }

  // 5th hero presentation card propped gently against the stack so camera reads front logo & brand cleanly
  const heroGeo = new THREE.BoxGeometry(cardW, cardT, cardD)
  const heroCard = new THREE.Mesh(heroGeo, cardMaterials)
  heroCard.position.set(0.05, 0.22, 0.18)
  heroCard.rotation.x = 0.56
  heroCard.rotation.y = 0.12
  enableShadows(heroCard)
  group.add(heroCard)

  return { group, labelMaterials: [labelMat], bounds: { width: 1.28, height: 0.42, depth: 0.95 } }
}

/**
 * 10. Sticker sheet — rounded-rect sheet, 6 die-cut stickers on canvas, slight curl on one corner, glossy vinyl
 */
export function buildStickerMockup(
  THREE: ThreeLib,
  texture: import('three').Texture
): MockupBuildResult {
  const group = new THREE.Group()
  const S = 1.18
  const cornerR = 0.075

  function makeCurledSheetGeometry(yOffset: number, flipNormals: boolean): import('three').BufferGeometry {
    const geo = new THREE.PlaneGeometry(S, S, 28, 28)
    geo.rotateX(-Math.PI * 0.5)
    const pos = geo.attributes.position as import('three').BufferAttribute

    const half = S * 0.5
    const inner = half - cornerR

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i)
      let z = pos.getZ(i)

      // Clamp outer corners into smooth rounded-rectangle arcs
      const dx = Math.max(0, Math.abs(x) - inner)
      const dz = Math.max(0, Math.abs(z) - inner)
      if (dx > 0 && dz > 0) {
        const dist = Math.hypot(dx, dz)
        if (dist > cornerR) {
          const nx = dx / dist
          const nz = dz / dist
          x = Math.sign(x) * (inner + nx * cornerR)
          z = Math.sign(z) * (inner + nz * cornerR)
        }
      }

      // Slight studio presentation tilt + glossy 3D peel curl on front-right corner (+X, +Z)
      const u = (x + half) / S
      const v = (z + half) / S
      let y = 0.012 + (1 - v) * 0.09 // gentle presentation slope toward viewer

      const curlDiag = u + v - 1.32
      if (curlDiag > 0) {
        y += Math.pow(curlDiag, 1.85) * 0.42
        x -= Math.pow(curlDiag, 2.0) * 0.08
        z -= Math.pow(curlDiag, 2.0) * 0.08
      }

      pos.setXYZ(i, x, y + yOffset, z)
    }

    if (flipNormals) {
      const idx = geo.index
      if (idx) {
        const arr = idx.array as Uint16Array | Uint32Array
        for (let i = 0; i < arr.length; i += 3) {
          const tmp = arr[i + 1]
          arr[i + 1] = arr[i + 2]
          arr[i + 2] = tmp
        }
      }
    }

    geo.computeVertexNormals()
    return geo
  }

  // Glossy vinyl top layer
  const vinylMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: texture,
    roughness: 0.1,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.15
  })

  // Matte release liner backing visible under curled corner
  const linerMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6e1d6,
    roughness: 0.82
  })

  const topSheet = new THREE.Mesh(makeCurledSheetGeometry(0.003, false), vinylMat)
  const backSheet = new THREE.Mesh(makeCurledSheetGeometry(0, true), linerMat)
  enableShadows(topSheet)
  enableShadows(backSheet)

  group.add(backSheet, topSheet)
  return { group, labelMaterials: [vinylMat], bounds: { width: S, height: 0.24, depth: S } }
}

export const MOCKUP_BUILDERS: Record<ProductId, MockupBuilderFn> = {
  box: buildBoxMockup,
  can: buildCanMockup,
  cup: buildCupMockup,
  bottle: buildBottleMockup,
  jar: buildJarMockup,
  pouch: buildPouchMockup,
  tote: buildToteMockup,
  paperbag: buildPaperBagMockup,
  card: buildCardMockup,
  sticker: buildStickerMockup
}

export function buildProductMockup(
  productId: ProductId,
  THREE: ThreeLib,
  texture: import('three').Texture,
  colorHex: string,
  finish: FinishType,
  options?: MockupBuildOptions
): MockupBuildResult {
  const builder = MOCKUP_BUILDERS[productId] || MOCKUP_BUILDERS.pouch
  return builder(THREE, texture, colorHex, finish, options)
}
