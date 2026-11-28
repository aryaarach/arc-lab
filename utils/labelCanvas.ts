import type { VibeType, LabelLayout } from '~/composables/useBrandState'

let fontsLoadedOnce = false
let grainPatternCanvas: HTMLCanvasElement | null = null

export async function ensureFontsReady(): Promise<void> {
  if (fontsLoadedOnce || typeof document === 'undefined') return
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
    fontsLoadedOnce = true
  } catch {
    fontsLoadedOnce = true
  }
}

function getPaperGrainCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  if (grainPatternCanvas) return grainPatternCanvas

  const c = document.createElement('canvas')
  c.width = 160
  c.height = 160
  const ctx = c.getContext('2d')
  if (!ctx) return null

  const img = ctx.createImageData(160, 160)
  const data = img.data
  // Deterministic PRNG so grain never flickers across redraws
  let seed = 42197
  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 16807) % 2147483647
    const v = 110 + (seed % 46)
    data[i] = v
    data[i + 1] = v - 2
    data[i + 2] = v - 5
    data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  grainPatternCanvas = c
  return c
}

function applyPaperGrain(ctx: CanvasRenderingContext2D, w: number, h: number, opacity = 0.055) {
  const grain = getPaperGrainCanvas()
  if (!grain) return
  const pat = ctx.createPattern(grain, 'repeat')
  if (!pat) return
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = pat
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastInk(hex: string): string {
  return hexLuminance(hex) > 0.56 ? '#171614' : '#FAF7F0'
}

function splitBrandLines(raw: string): [string, string] {
  const clean = (raw.trim() || 'KOPI SENJA').slice(0, 18).toUpperCase()
  const words = clean.split(/\s+/).filter(Boolean)
  if (clean.length > 9 && words.length >= 2) {
    const mid = Math.ceil(words.length / 2)
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
  }
  return [clean, '']
}

function drawCoffeeBeanIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fillColor: string,
  cutColor: string
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(0.42)

  // Bean oval body
  ctx.fillStyle = fillColor
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 0.74, r, 0, 0, Math.PI * 2)
  ctx.fill()

  // Characteristic S-curved center cleft
  ctx.strokeStyle = cutColor
  ctx.lineWidth = Math.max(1.8, r * 0.14)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.88)
  ctx.bezierCurveTo(-r * 0.24, -r * 0.28, r * 0.24, r * 0.28, 0, r * 0.88)
  ctx.stroke()

  ctx.restore()
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  tracking: number
) {
  const chars = Array.from(text)
  if (chars.length <= 1 || tracking <= 0) {
    ctx.textAlign = 'center'
    ctx.fillText(text, cx, y)
    return
  }
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  const totalW = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1)
  let x = cx - totalW * 0.5
  ctx.textAlign = 'left'
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y)
    x += widths[i] + tracking
  }
}

function drawCoffeePlantBranch(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  height: number,
  direction: 1 | -1,
  color: string
) {
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'

  // Gently curving stem
  ctx.lineWidth = Math.max(2, height * 0.022)
  ctx.beginPath()
  ctx.moveTo(baseX, baseY)
  ctx.quadraticCurveTo(
    baseX + direction * height * 0.14,
    baseY - height * 0.52,
    baseX + direction * height * 0.04,
    baseY - height
  )
  ctx.stroke()

  // Botanical coffee leaves along stem
  const pairs = 5
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 0.6)
    const sx = baseX + direction * height * (0.12 * Math.sin(t * Math.PI) + 0.04 * t)
    const sy = baseY - height * t
    const leafLen = height * (0.26 - t * 0.1)
    const leafWid = leafLen * 0.34

    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(sx, sy)
      ctx.rotate(side * (0.65 + t * 0.25) - direction * 0.12)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(side * leafLen * 0.5, -leafWid, side * leafLen, -leafWid * 0.15)
      ctx.quadraticCurveTo(side * leafLen * 0.5, leafWid * 0.7, 0, 0)
      ctx.fill()
      ctx.restore()
    }
  }
  ctx.restore()
}

function drawSenjaBrandMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  inkColor: string,
  accentColor: string
) {
  drawCoffeeBeanIcon(ctx, cx, cy, r * 0.85, inkColor, accentColor)
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Draws a single print-grade graphic face inside sub-rectangle (ox, oy, fw, fh)
 */
function drawCoreFace(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  fw: number,
  fh: number,
  brand: string,
  vibe: VibeType,
  colorHex: string,
  compact = false
) {
  const [line1, line2] = splitBrandLines(brand)
  const onColor = contrastInk(colorHex)
  const cx = ox + fw * 0.5

  ctx.save()
  ctx.beginPath()
  ctx.rect(ox, oy, fw, fh)
  ctx.clip()

  if (vibe === 'Minimalis') {
    // Ultra-Premium Specialty Coffee Packaging ("KOPI SENJA" reference art direction)
    // Deep espresso matte foil base (#35180F -> #512719) with golden sunset mountain landscape
    const isDefaultSunset = colorHex.toLowerCase() === '#ff6b4a' || colorHex.toLowerCase() === '#ffd84d'
    const espressoDeep = '#2D140C'
    const espressoTop = '#442014'
    const skyMid = isDefaultSunset ? '#C66A2D' : colorHex
    const skyAmber = isDefaultSunset ? '#E99A42' : '#E99A42'
    const cream = '#F3DFC0'
    const gold = '#D6B17A'

    // Base rich deep espresso vertical gradient
    const bgGrad = ctx.createLinearGradient(ox, oy, ox, oy + fh)
    bgGrad.addColorStop(0, '#3C1B11')
    bgGrad.addColorStop(0.28, espressoTop)
    bgGrad.addColorStop(0.52, '#6A321B')
    bgGrad.addColorStop(0.75, '#35180F')
    bgGrad.addColorStop(1, espressoDeep)
    ctx.fillStyle = bgGrad
    ctx.fillRect(ox, oy, fw, fh)

    // Subtle atmospheric warm evening sky glow in middle band
    const skyY = oy + fh * 0.57
    const skyGlow = ctx.createRadialGradient(cx, skyY, fw * 0.04, cx, skyY, fw * 0.62)
    skyGlow.addColorStop(0, '#FFE79E')
    skyGlow.addColorStop(0.24, skyAmber)
    skyGlow.addColorStop(0.54, skyMid)
    skyGlow.addColorStop(0.84, 'rgba(68, 32, 20, 0.25)')
    skyGlow.addColorStop(1, 'rgba(45, 20, 12, 0)')
    ctx.fillStyle = skyGlow
    ctx.fillRect(ox, oy + fh * 0.36, fw, fh * 0.44)

    // --- TOP SECTION: Coffee Bean Emblem + Tapered Gold Rules + Serif Typography ---
    const beanY = oy + fh * 0.195
    const beanR = fw * 0.036

    // Tapered horizontal champagne-gold decorative lines flanking the bean
    const lineGradL = ctx.createLinearGradient(ox + fw * 0.16, beanY, cx - beanR * 1.9, beanY)
    lineGradL.addColorStop(0, 'rgba(214, 177, 122, 0)')
    lineGradL.addColorStop(1, 'rgba(214, 177, 122, 0.85)')
    ctx.strokeStyle = lineGradL
    ctx.lineWidth = Math.max(1.4, fw * 0.0022)
    ctx.beginPath()
    ctx.moveTo(ox + fw * 0.17, beanY)
    ctx.lineTo(cx - beanR * 1.9, beanY)
    ctx.stroke()

    const lineGradR = ctx.createLinearGradient(cx + beanR * 1.9, beanY, ox + fw * 0.83, beanY)
    lineGradR.addColorStop(0, 'rgba(214, 177, 122, 0.85)')
    lineGradR.addColorStop(1, 'rgba(214, 177, 122, 0)')
    ctx.strokeStyle = lineGradR
    ctx.beginPath()
    ctx.moveTo(cx + beanR * 1.9, beanY)
    ctx.lineTo(ox + fw * 0.83, beanY)
    ctx.stroke()

    drawCoffeeBeanIcon(ctx, cx, beanY, beanR, cream, espressoDeep)

    // High-Contrast Champagne Cream Serif Brand Typography
    ctx.fillStyle = cream
    if (line2) {
      // Top smaller spaced uppercase ("KOPI")
      const topSize = Math.round(fw * 0.056)
      ctx.font = `600 ${topSize}px "Playfair Display", Georgia, serif`
      drawSpacedText(ctx, line1, cx, oy + fh * 0.282, fw * 0.022)

      // Dominant large uppercase serif ("SENJA")
      const mainSize = Math.round(fw * 0.172)
      ctx.font = `700 ${mainSize}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(line2, cx, oy + fh * 0.408, fw * 0.84)
    } else {
      const mainSize = Math.round(fw * 0.15)
      ctx.font = `700 ${mainSize}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(line1, cx, oy + fh * 0.365, fw * 0.84)
    }

    // --- MIDDLE SECTION: Cinematic Sunset Landscape (40-45% of pouch) ---
    const sunR = fw * 0.155
    const sunY = oy + fh * 0.595

    // Large glowing golden-orange setting sun
    const sunGrad = ctx.createLinearGradient(cx, sunY - sunR, cx, sunY + sunR * 0.5)
    sunGrad.addColorStop(0, '#FFF1B8')
    sunGrad.addColorStop(0.52, '#F7B752')
    sunGrad.addColorStop(1, '#DF7A32')
    ctx.fillStyle = sunGrad
    ctx.beginPath()
    ctx.arc(cx, sunY, sunR, 0, Math.PI * 2)
    ctx.fill()

    // Subtle evening horizontal cloud wisps across horizon
    ctx.fillStyle = 'rgba(243, 223, 192, 0.22)'
    const drawCloudWisp = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath()
      ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    drawCloudWisp(ox + fw * 0.18, oy + fh * 0.52, fw * 0.28, fh * 0.015)
    drawCloudWisp(ox + fw * 0.83, oy + fh * 0.51, fw * 0.26, fh * 0.014)
    drawCloudWisp(ox + fw * 0.74, oy + fh * 0.548, fw * 0.22, fh * 0.012)
    drawCloudWisp(ox + fw * 0.28, oy + fh * 0.56, fw * 0.2, fh * 0.011)

    // Small flying birds in the distant right sky
    ctx.strokeStyle = '#3B1B10'
    ctx.lineWidth = Math.max(1.6, fw * 0.0032)
    ctx.lineCap = 'round'
    const drawBird = (bx: number, by: number, s: number) => {
      ctx.beginPath()
      ctx.moveTo(bx - s, by - s * 0.15)
      ctx.quadraticCurveTo(bx - s * 0.45, by - s * 0.55, bx, by)
      ctx.quadraticCurveTo(bx + s * 0.45, by - s * 0.55, bx + s, by - s * 0.15)
      ctx.stroke()
    }
    drawBird(ox + fw * 0.71, oy + fh * 0.535, fw * 0.024)
    drawBird(ox + fw * 0.77, oy + fh * 0.508, fw * 0.022)
    drawBird(ox + fw * 0.76, oy + fh * 0.558, fw * 0.016)

    // Layered mountain silhouettes (back to front)
    // Layer 1: Distant burnt-amber mountain range
    ctx.fillStyle = '#B8622D'
    ctx.beginPath()
    ctx.moveTo(ox, oy + fh * 0.72)
    ctx.lineTo(ox + fw * 0.14, oy + fh * 0.625)
    ctx.lineTo(ox + fw * 0.29, oy + fh * 0.65)
    ctx.lineTo(ox + fw * 0.42, oy + fh * 0.585)
    ctx.lineTo(ox + fw * 0.58, oy + fh * 0.642)
    ctx.lineTo(ox + fw * 0.78, oy + fh * 0.578)
    ctx.lineTo(ox + fw * 0.94, oy + fh * 0.63)
    ctx.lineTo(ox + fw, oy + fh * 0.61)
    ctx.lineTo(ox + fw, oy + fh * 0.78)
    ctx.lineTo(ox, oy + fh * 0.78)
    ctx.closePath()
    ctx.fill()

    // Layer 2: Mid warm-brown mountain peaks
    ctx.fillStyle = '#89401D'
    ctx.beginPath()
    ctx.moveTo(ox, oy + fh * 0.68)
    ctx.lineTo(ox + fw * 0.22, oy + fh * 0.615)
    ctx.lineTo(ox + fw * 0.36, oy + fh * 0.675)
    ctx.lineTo(ox + fw * 0.53, oy + fh * 0.618)
    ctx.lineTo(ox + fw * 0.69, oy + fh * 0.662)
    ctx.lineTo(ox + fw * 0.87, oy + fh * 0.615)
    ctx.lineTo(ox + fw, oy + fh * 0.65)
    ctx.lineTo(ox + fw, oy + fh * 0.8)
    ctx.lineTo(ox, oy + fh * 0.8)
    ctx.closePath()
    ctx.fill()

    // Layer 3: Deep roasted coffee brown foothills
    ctx.fillStyle = '#562715'
    ctx.beginPath()
    ctx.moveTo(ox, oy + fh * 0.7)
    ctx.quadraticCurveTo(ox + fw * 0.24, oy + fh * 0.645, ox + fw * 0.46, oy + fh * 0.705)
    ctx.quadraticCurveTo(ox + fw * 0.72, oy + fh * 0.655, ox + fw, oy + fh * 0.715)
    ctx.lineTo(ox + fw, oy + fh * 0.82)
    ctx.lineTo(ox, oy + fh * 0.82)
    ctx.closePath()
    ctx.fill()

    // Botanical coffee plant silhouettes framing left & right foreground
    drawCoffeePlantBranch(ctx, ox + fw * 0.14, oy + fh * 0.76, fh * 0.22, 1, '#2B120A')
    drawCoffeePlantBranch(ctx, ox + fw * 0.31, oy + fh * 0.76, fh * 0.11, 1, '#37180E')
    drawCoffeePlantBranch(ctx, ox + fw * 0.84, oy + fh * 0.77, fh * 0.16, -1, '#2B120A')
    drawCoffeePlantBranch(ctx, ox + fw * 0.71, oy + fh * 0.76, fh * 0.095, -1, '#37180E')

    // --- LOWER SECTION: Sophisticated Curved Dark-Espresso Foreground Hill ---
    const hillGrad = ctx.createLinearGradient(ox, oy + fh * 0.7, ox, oy + fh)
    hillGrad.addColorStop(0, '#36180F')
    hillGrad.addColorStop(0.45, '#2B120A')
    hillGrad.addColorStop(1, '#210D07')
    ctx.fillStyle = hillGrad
    ctx.beginPath()
    ctx.moveTo(ox, oy + fh * 0.745)
    ctx.bezierCurveTo(
      ox + fw * 0.28,
      oy + fh * 0.665,
      ox + fw * 0.56,
      oy + fh * 0.775,
      ox + fw,
      oy + fh * 0.735
    )
    ctx.lineTo(ox + fw, oy + fh)
    ctx.lineTo(ox, oy + fh)
    ctx.closePath()
    ctx.fill()

    // Subtle warm golden-brown rim highlight along curved hill crest
    ctx.strokeStyle = 'rgba(214, 177, 122, 0.28)'
    ctx.lineWidth = Math.max(1.5, fw * 0.0025)
    ctx.beginPath()
    ctx.moveTo(ox, oy + fh * 0.745)
    ctx.bezierCurveTo(
      ox + fw * 0.28,
      oy + fh * 0.665,
      ox + fw * 0.56,
      oy + fh * 0.775,
      ox + fw,
      oy + fh * 0.735
    )
    ctx.stroke()

    if (!compact) {
      // Tagline: "Nikmat di Setiap Senja" in italic serif with flanking gold lines
      const tagY = oy + fh * 0.818
      ctx.fillStyle = cream
      ctx.textAlign = 'center'
      ctx.font = `italic 500 ${Math.round(fw * 0.036)}px "Playfair Display", Georgia, serif`
      ctx.fillText('Nikmat di Setiap Senja', cx, tagY)

      const tagHalfW = ctx.measureText('Nikmat di Setiap Senja').width * 0.5 + fw * 0.028
      ctx.strokeStyle = 'rgba(214, 177, 122, 0.72)'
      ctx.lineWidth = Math.max(1.2, fw * 0.0018)
      ctx.beginPath()
      ctx.moveTo(ox + fw * 0.14, tagY - fh * 0.008)
      ctx.lineTo(cx - tagHalfW, tagY - fh * 0.008)
      ctx.moveTo(cx + tagHalfW, tagY - fh * 0.008)
      ctx.lineTo(ox + fw * 0.86, tagY - fh * 0.008)
      ctx.stroke()

      // Bottom Product Info Row (Left: 100% KOPI INDONESIA | Center Gold Rule | Right: Berat Bersih: 250 g)
      const infoY = oy + fh * 0.895
      drawCoffeeBeanIcon(ctx, ox + fw * 0.225, infoY + fh * 0.005, fw * 0.022, gold, espressoDeep)

      ctx.fillStyle = cream
      ctx.textAlign = 'left'
      ctx.font = `600 ${Math.round(fw * 0.031)}px "Inter", sans-serif`
      ctx.fillText('100%', ox + fw * 0.265, infoY)
      ctx.fillStyle = gold
      ctx.font = `500 ${Math.round(fw * 0.019)}px "Inter", sans-serif`
      ctx.fillText('KOPI INDONESIA', ox + fw * 0.265, infoY + fh * 0.024)

      // Thin vertical champagne-gold separator
      ctx.strokeStyle = 'rgba(214, 177, 122, 0.55)'
      ctx.lineWidth = Math.max(1.2, fw * 0.0018)
      ctx.beginPath()
      ctx.moveTo(cx + fw * 0.05, infoY - fh * 0.024)
      ctx.lineTo(cx + fw * 0.05, infoY + fh * 0.032)
      ctx.stroke()

      // Weight info on right
      ctx.fillStyle = gold
      ctx.font = `500 ${Math.round(fw * 0.019)}px "Inter", sans-serif`
      ctx.fillText('Berat Bersih:', cx + fw * 0.09, infoY - fh * 0.004)
      ctx.fillStyle = cream
      ctx.font = `600 ${Math.round(fw * 0.033)}px "Inter", sans-serif`
      ctx.fillText('250 g', cx + fw * 0.09, infoY + fh * 0.026)
    }

    // Subtle realistic perimeter heat-seal edge shading on top & sides (for commercial pouch realism)
    const topSealGrad = ctx.createLinearGradient(ox, oy, ox, oy + fh * 0.13)
    topSealGrad.addColorStop(0, 'rgba(20, 8, 4, 0.35)')
    topSealGrad.addColorStop(0.75, 'rgba(20, 8, 4, 0.08)')
    topSealGrad.addColorStop(0.88, 'rgba(255, 232, 200, 0.12)')
    topSealGrad.addColorStop(0.94, 'rgba(15, 6, 3, 0.28)')
    topSealGrad.addColorStop(1, 'rgba(15, 6, 3, 0)')
    ctx.fillStyle = topSealGrad
    ctx.fillRect(ox, oy, fw, fh * 0.13)
  } else if (vibe === 'Playful') {
    // Vibrant Tropical Botanical & Sunset Arch Packaging
    const bgGrad = ctx.createLinearGradient(ox, oy, ox, oy + fh)
    bgGrad.addColorStop(0, colorHex)
    bgGrad.addColorStop(1, '#3A1A10')
    ctx.fillStyle = bgGrad
    ctx.fillRect(ox, oy, fw, fh)

    // Subtle sunlit radial glow at top
    const glow = ctx.createRadialGradient(cx, oy + fh * 0.28, fw * 0.05, cx, oy + fh * 0.28, fw * 0.65)
    glow.addColorStop(0, 'rgba(255, 240, 194, 0.28)')
    glow.addColorStop(1, 'rgba(255, 240, 194, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(ox, oy, fw, fh * 0.55)

    // Warm cream editorial arch card
    const winW = fw * 0.8
    const winH = fh * 0.72
    const wx = ox + (fw - winW) * 0.5
    const wy = oy + fh * 0.165
    ctx.fillStyle = '#FAF4E8'
    drawRoundedRect(ctx, wx, wy, winW, winH, winW * 0.12)
    ctx.fill()

    // Inner hairline accent frame
    ctx.strokeStyle = colorHex
    ctx.lineWidth = Math.max(2, fw * 0.004)
    drawRoundedRect(ctx, wx + fw * 0.022, wy + fw * 0.022, winW - fw * 0.044, winH - fw * 0.044, winW * 0.1)
    ctx.stroke()

    // Top pill badge
    const pillW = winW * 0.58
    const pillH = fh * 0.048
    ctx.fillStyle = '#2B140C'
    drawRoundedRect(ctx, cx - pillW * 0.5, wy + winH * 0.075, pillW, pillH, pillH * 0.5)
    ctx.fill()
    ctx.fillStyle = '#F3DFC0'
    ctx.textAlign = 'center'
    ctx.font = `700 ${Math.round(fw * 0.021)}px "JetBrains Mono", monospace`
    ctx.fillText('ROASTED FRESH · NUSANTARA', cx, wy + winH * 0.075 + pillH * 0.68)

    // Coffee bean emblem + brand typography
    drawCoffeeBeanIcon(ctx, cx, wy + winH * 0.225, fw * 0.034, colorHex, '#FAF4E8')

    ctx.fillStyle = '#2A130C'
    if (line2) {
      ctx.font = `600 ${Math.round(fw * 0.048)}px "Playfair Display", Georgia, serif`
      drawSpacedText(ctx, line1, cx, wy + winH * 0.34, fw * 0.018)
      ctx.font = `700 ${Math.round(fw * 0.135)}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(line2, cx, wy + winH * 0.47, winW * 0.86)
    } else {
      ctx.font = `700 ${Math.round(fw * 0.125)}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(line1, cx, wy + winH * 0.43, winW * 0.86)
    }

    // Mini sunset horizon & tropical hills inside bottom of arch card
    const artY = wy + winH * 0.54
    const artH = winH * 0.34
    ctx.save()
    ctx.beginPath()
    drawRoundedRect(ctx, wx + fw * 0.036, artY, winW - fw * 0.072, artH, winW * 0.07)
    ctx.clip()

    const miniSky = ctx.createLinearGradient(cx, artY, cx, artY + artH)
    miniSky.addColorStop(0, '#FBE29D')
    miniSky.addColorStop(0.55, '#E99A42')
    miniSky.addColorStop(1, colorHex)
    ctx.fillStyle = miniSky
    ctx.fillRect(wx, artY, winW, artH)

    // Sun disc
    ctx.fillStyle = '#FFF5CC'
    ctx.beginPath()
    ctx.arc(cx, artY + artH * 0.52, fw * 0.1, 0, Math.PI * 2)
    ctx.fill()

    // Layered playful hills
    ctx.fillStyle = '#8D431E'
    ctx.beginPath()
    ctx.moveTo(wx, artY + artH * 0.72)
    ctx.quadraticCurveTo(cx - fw * 0.16, artY + artH * 0.36, cx + fw * 0.06, artY + artH * 0.68)
    ctx.quadraticCurveTo(cx + fw * 0.26, artY + artH * 0.42, wx + winW, artY + artH * 0.72)
    ctx.lineTo(wx + winW, artY + artH)
    ctx.lineTo(wx, artY + artH)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#35180F'
    ctx.beginPath()
    ctx.moveTo(wx, artY + artH * 0.82)
    ctx.quadraticCurveTo(cx, artY + artH * 0.58, wx + winW, artY + artH * 0.82)
    ctx.lineTo(wx + winW, artY + artH)
    ctx.lineTo(wx, artY + artH)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    if (!compact) {
      ctx.fillStyle = '#2A130C'
      ctx.textAlign = 'center'
      ctx.font = `italic 600 ${Math.round(fw * 0.03)}px "Playfair Display", Georgia, serif`
      ctx.fillText('Nikmat di Setiap Senja', cx, wy + winH * 0.945)

      ctx.fillStyle = '#F3DFC0'
      ctx.font = `600 ${Math.round(fw * 0.022)}px "JetBrains Mono", monospace`
      ctx.fillText('100% KOPI INDONESIA  ·  250 g', cx, oy + fh * 0.945)
    }
  } else if (vibe === 'Premium') {
    // Deep Matte Obsidian-Espresso Stock with Champagne Gold Foil Sunset Crest
    const obsGrad = ctx.createLinearGradient(ox, oy, ox, oy + fh)
    obsGrad.addColorStop(0, '#181416')
    obsGrad.addColorStop(0.5, '#121012')
    obsGrad.addColorStop(1, '#0C0A0C')
    ctx.fillStyle = obsGrad
    ctx.fillRect(ox, oy, fw, fh)

    const pad = fw * 0.085
    const gold = '#D6B17A'
    const cream = '#F3DFC0'

    // Double champagne-gold hairline frame
    ctx.strokeStyle = 'rgba(214, 177, 122, 0.75)'
    ctx.lineWidth = Math.max(1.5, fw * 0.0025)
    ctx.strokeRect(ox + pad, oy + fh * 0.135, fw - pad * 2, fh * 0.785)
    ctx.strokeStyle = 'rgba(214, 177, 122, 0.32)'
    ctx.lineWidth = Math.max(1, fw * 0.0014)
    ctx.strokeRect(ox + pad * 1.2, oy + fh * 0.15, fw - pad * 2.4, fh * 0.755)

    // Top coffee bean emblem + gold rules
    const beanY = oy + fh * 0.22
    drawCoffeeBeanIcon(ctx, cx, beanY, fw * 0.032, gold, '#121012')
    ctx.strokeStyle = 'rgba(214, 177, 122, 0.55)'
    ctx.lineWidth = Math.max(1.2, fw * 0.0018)
    ctx.beginPath()
    ctx.moveTo(ox + pad * 2, beanY)
    ctx.lineTo(cx - fw * 0.06, beanY)
    ctx.moveTo(cx + fw * 0.06, beanY)
    ctx.lineTo(ox + fw - pad * 2, beanY)
    ctx.stroke()

    ctx.fillStyle = gold
    ctx.textAlign = 'center'
    ctx.font = `600 ${Math.round(fw * 0.022)}px "JetBrains Mono", monospace`
    ctx.fillText('RESERVE EDITION · SINGLE ORIGIN', cx, oy + fh * 0.285)

    // Refined Champagne Serif Brand Wordmark
    ctx.fillStyle = cream
    if (line2) {
      ctx.font = `600 ${Math.round(fw * 0.052)}px "Playfair Display", Georgia, serif`
      drawSpacedText(ctx, line1, cx, oy + fh * 0.365, fw * 0.022)
      ctx.font = `700 ${Math.round(fw * 0.155)}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(line2, cx, oy + fh * 0.485, fw - pad * 3)
    } else {
      ctx.font = `700 ${Math.round(fw * 0.135)}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(line1, cx, oy + fh * 0.44, fw - pad * 3)
    }

    // Minimalist Gold-Foil Line-Art Sunset Mountain Medallion
    const medY = oy + fh * 0.625
    const medR = fw * 0.165
    ctx.save()
    ctx.strokeStyle = gold
    ctx.lineWidth = Math.max(1.6, fw * 0.0028)
    ctx.beginPath()
    ctx.arc(cx, medY, medR, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, medY, medR * 0.92, 0, Math.PI * 2)
    ctx.clip()

    // Subtle warm gold sun glow inside medallion
    const medGlow = ctx.createRadialGradient(cx, medY + medR * 0.05, medR * 0.05, cx, medY, medR)
    medGlow.addColorStop(0, 'rgba(233, 154, 66, 0.42)')
    medGlow.addColorStop(0.55, 'rgba(198, 106, 45, 0.18)')
    medGlow.addColorStop(1, 'rgba(18, 16, 18, 0)')
    ctx.fillStyle = medGlow
    ctx.fillRect(cx - medR, medY - medR, medR * 2, medR * 2)

    // Foil sun arc
    ctx.fillStyle = gold
    ctx.beginPath()
    ctx.arc(cx, medY + medR * 0.12, medR * 0.42, Math.PI, 0, false)
    ctx.fill()

    // Gold-outlined dark mountains
    ctx.fillStyle = '#141215'
    ctx.beginPath()
    ctx.moveTo(cx - medR, medY + medR * 0.4)
    ctx.lineTo(cx - medR * 0.35, medY - medR * 0.05)
    ctx.lineTo(cx + medR * 0.05, medY + medR * 0.25)
    ctx.lineTo(cx + medR * 0.45, medY - medR * 0.12)
    ctx.lineTo(cx + medR, medY + medR * 0.38)
    ctx.lineTo(cx + medR, medY + medR)
    ctx.lineTo(cx - medR, medY + medR)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = gold
    ctx.stroke()
    ctx.restore()

    if (!compact) {
      ctx.fillStyle = cream
      ctx.textAlign = 'center'
      ctx.font = `italic 500 ${Math.round(fw * 0.034)}px "Playfair Display", Georgia, serif`
      ctx.fillText('Nikmat di Setiap Senja', cx, oy + fh * 0.81)

      ctx.fillStyle = gold
      ctx.font = `600 ${Math.round(fw * 0.021)}px "JetBrains Mono", monospace`
      ctx.fillText('100% KOPI INDONESIA  |  BERAT BERSIH 250 g', cx, oy + fh * 0.872)
    }
  } else {
    // Retro Heritage Nusantara Parchment with Warm Terracotta Sunset Emblem
    ctx.fillStyle = '#F3E5CE'
    ctx.fillRect(ox, oy, fw, fh)

    const pad = fw * 0.075
    const espresso = '#35180F'
    const terracotta = colorHex === '#FFD84D' ? '#C66A2D' : colorHex

    // Classic double apothecary border
    ctx.strokeStyle = espresso
    ctx.lineWidth = Math.max(2.5, fw * 0.005)
    drawRoundedRect(ctx, ox + pad, oy + fh * 0.135, fw - pad * 2, fh * 0.785, fw * 0.03)
    ctx.stroke()
    ctx.lineWidth = Math.max(1.2, fw * 0.002)
    drawRoundedRect(ctx, ox + pad * 1.25, oy + fh * 0.15, fw - pad * 2.5, fh * 0.755, fw * 0.022)
    ctx.stroke()

    // Vintage header label
    ctx.fillStyle = espresso
    ctx.textAlign = 'center'
    ctx.font = `700 ${Math.round(fw * 0.023)}px "JetBrains Mono", monospace`
    ctx.fillText('RACIKAN KLASIK NUSANTARA', cx, oy + fh * 0.205)

    drawCoffeeBeanIcon(ctx, cx, oy + fh * 0.265, fw * 0.032, espresso, '#F3E5CE')

    // Heritage horizontal ribbon band with brand name
    const bandY = oy + fh * 0.325
    const bandH = fh * 0.215
    ctx.fillStyle = terracotta
    ctx.fillRect(ox + pad * 1.25, bandY, fw - pad * 2.5, bandH)
    ctx.fillStyle = espresso
    ctx.fillRect(ox + pad * 1.25, bandY - fh * 0.01, fw - pad * 2.5, fh * 0.008)
    ctx.fillRect(ox + pad * 1.25, bandY + bandH + fh * 0.002, fw - pad * 2.5, fh * 0.008)

    ctx.fillStyle = contrastInk(terracotta)
    if (line2) {
      ctx.font = `600 ${Math.round(fw * 0.048)}px "Playfair Display", Georgia, serif`
      drawSpacedText(ctx, line1, cx, bandY + bandH * 0.34, fw * 0.02)
      ctx.font = `700 ${Math.round(fw * 0.135)}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(line2, cx, bandY + bandH * 0.82, fw - pad * 3)
    } else {
      ctx.font = `700 ${Math.round(fw * 0.125)}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(line1, cx, bandY + bandH * 0.65, fw - pad * 3)
    }

    // Woodcut-style sunset mountain emblem below ribbon
    const woodY = oy + fh * 0.59
    const woodW = fw * 0.68
    const woodH = fh * 0.18
    ctx.save()
    ctx.beginPath()
    drawRoundedRect(ctx, cx - woodW * 0.5, woodY, woodW, woodH, fw * 0.025)
    ctx.clip()

    const retroSky = ctx.createLinearGradient(cx, woodY, cx, woodY + woodH)
    retroSky.addColorStop(0, '#E99A42')
    retroSky.addColorStop(1, '#C66A2D')
    ctx.fillStyle = retroSky
    ctx.fillRect(cx - woodW * 0.5, woodY, woodW, woodH)

    ctx.fillStyle = '#F3DFC0'
    ctx.beginPath()
    ctx.arc(cx, woodY + woodH * 0.62, woodW * 0.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#512719'
    ctx.beginPath()
    ctx.moveTo(cx - woodW * 0.5, woodY + woodH * 0.78)
    ctx.lineTo(cx - woodW * 0.18, woodY + woodH * 0.38)
    ctx.lineTo(cx + woodW * 0.08, woodY + woodH * 0.68)
    ctx.lineTo(cx + woodW * 0.32, woodY + woodH * 0.34)
    ctx.lineTo(cx + woodW * 0.5, woodY + woodH * 0.76)
    ctx.lineTo(cx + woodW * 0.5, woodY + woodH)
    ctx.lineTo(cx - woodW * 0.5, woodY + woodH)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = espresso
    ctx.beginPath()
    ctx.moveTo(cx - woodW * 0.5, woodY + woodH * 0.85)
    ctx.quadraticCurveTo(cx, woodY + woodH * 0.65, cx + woodW * 0.5, woodY + woodH * 0.85)
    ctx.lineTo(cx + woodW * 0.5, woodY + woodH)
    ctx.lineTo(cx - woodW * 0.5, woodY + woodH)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    ctx.strokeStyle = espresso
    ctx.lineWidth = Math.max(1.8, fw * 0.003)
    drawRoundedRect(ctx, cx - woodW * 0.5, woodY, woodW, woodH, fw * 0.025)
    ctx.stroke()

    if (!compact) {
      ctx.fillStyle = espresso
      ctx.textAlign = 'center'
      ctx.font = `italic 600 ${Math.round(fw * 0.032)}px "Playfair Display", Georgia, serif`
      ctx.fillText('Nikmat di Setiap Senja', cx, oy + fh * 0.825)

      ctx.font = `700 ${Math.round(fw * 0.022)}px "JetBrains Mono", monospace`
      ctx.fillText('100% KOPI INDONESIA  ·  BERAT BERSIH 250 g', cx, oy + fh * 0.878)
    }
  }

  ctx.restore()
}

export async function drawLabel(
  brand: string,
  vibe: VibeType,
  colorHex: string,
  layout: LabelLayout,
  sizeScale = 1
): Promise<HTMLCanvasElement> {
  await ensureFontsReady()

  const canvas = document.createElement('canvas')

  if (layout === 'wrap') {
    // 2:1 Cylinder Wrap (Front label centered + realistic back nutrition/origin panel)
    const W = Math.round(1536 * sizeScale)
    const H = Math.round(768 * sizeScale)
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Base seamless band background matching vibe
    const baseBg =
      vibe === 'Minimalis'
        ? '#35180F'
        : vibe === 'Premium'
          ? '#161619'
          : vibe === 'Retro'
            ? '#F2E7D3'
            : colorHex
    ctx.fillStyle = baseBg
    ctx.fillRect(0, 0, W, H)

    // Center front hero label (occupies middle 52% of circumference)
    const fw = W * 0.5
    drawCoreFace(ctx, (W - fw) * 0.5, 0, fw, H, brand, vibe, colorHex, false)

    // Realistic back packaging info & barcode on left/right wings
    const ink =
      vibe === 'Minimalis' || vibe === 'Premium'
        ? '#F3DFC0'
        : vibe === 'Playful'
          ? contrastInk(colorHex)
          : '#262320'
    ctx.fillStyle = ink
    ctx.globalAlpha = 0.78
    const bx = W * 0.06
    const by = H * 0.2
    ctx.font = `600 ${Math.max(10, Math.round(H * 0.028))}px "JetBrains Mono", monospace`
    ctx.fillText('KOMPOSISI & INFORMASI PRODUK', bx, by)
    ctx.font = `400 ${Math.max(9, Math.round(H * 0.024))}px "Inter", sans-serif`
    ctx.fillText('Diproduksi secara higienis oleh UMKM', bx, by + H * 0.055)
    ctx.fillText('Indonesia. Simpan di tempat sejuk.', bx, by + H * 0.095)

    // Printed EAN barcode block on right wing
    const barX = W * 0.82
    const barY = H * 0.58
    const barW = W * 0.11
    const barH = H * 0.22
    ctx.globalAlpha = 1
    ctx.fillStyle = '#FAF8F4'
    ctx.fillRect(barX - 8, barY - 8, barW + 16, barH + 16)
    ctx.fillStyle = '#18181A'
    for (let i = 0; i < 24; i++) {
      const lw = (i % 3 === 0 ? 3.5 : 1.5) * sizeScale
      ctx.fillRect(barX + i * (barW / 24), barY, lw, barH)
    }

    applyPaperGrain(ctx, W, H, 0.05)
    return canvas
  }

  if (layout === 'card') {
    // High-res Luxury Business Card (1.75 : 1) synced with all 4 Gaya Label
    const W = Math.round(1400 * sizeScale)
    const H = Math.round(800 * sizeScale)
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const [line1, line2] = splitBrandLines(brand)
    const fullBrand = line2 ? `${line1} ${line2}` : line1
    const handleSlug = fullBrand.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'kopisenja'
    const cream = '#F3DFC0'
    const gold = '#D6B17A'
    const espresso = '#35180F'

    if (vibe === 'Minimalis') {
      // Deep espresso matte card with warm sunset mountain horizon on right & Playfair Display serif
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#3C1B11')
      bg.addColorStop(0.55, '#2E140C')
      bg.addColorStop(1, '#210D07')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Subtle golden sunset glow on right side
      const sx = W * 0.77
      const sy = H * 0.56
      const glow = ctx.createRadialGradient(sx, sy, W * 0.02, sx, sy, W * 0.32)
      glow.addColorStop(0, 'rgba(255, 234, 168, 0.55)')
      glow.addColorStop(0.35, 'rgba(233, 154, 66, 0.3)')
      glow.addColorStop(0.7, 'rgba(198, 106, 45, 0.1)')
      glow.addColorStop(1, 'rgba(45, 20, 12, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(W * 0.42, 0, W * 0.58, H)

      // Setting sun disc on right
      const sunGrad = ctx.createLinearGradient(sx, sy - H * 0.18, sx, sy + H * 0.08)
      sunGrad.addColorStop(0, '#FFF1B8')
      sunGrad.addColorStop(0.6, '#F2AE4B')
      sunGrad.addColorStop(1, '#C66A2D')
      ctx.fillStyle = sunGrad
      ctx.beginPath()
      ctx.arc(sx, sy, H * 0.17, 0, Math.PI * 2)
      ctx.fill()

      // Layered sunset mountain silhouettes across right-bottom
      ctx.fillStyle = '#9D4B22'
      ctx.beginPath()
      ctx.moveTo(W * 0.46, H)
      ctx.lineTo(W * 0.62, H * 0.6)
      ctx.lineTo(W * 0.74, H * 0.7)
      ctx.lineTo(W * 0.87, H * 0.54)
      ctx.lineTo(W, H * 0.66)
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#562715'
      ctx.beginPath()
      ctx.moveTo(W * 0.42, H)
      ctx.quadraticCurveTo(W * 0.64, H * 0.62, W * 0.82, H * 0.74)
      ctx.quadraticCurveTo(W * 0.92, H * 0.68, W, H * 0.75)
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()

      // Curved espresso foreground sweep
      ctx.fillStyle = '#240F09'
      ctx.beginPath()
      ctx.moveTo(0, H * 0.84)
      ctx.bezierCurveTo(W * 0.35, H * 0.76, W * 0.68, H * 0.88, W, H * 0.79)
      ctx.lineTo(W, H)
      ctx.lineTo(0, H)
      ctx.closePath()
      ctx.fill()

      // Subtle champagne-gold hairline border
      ctx.strokeStyle = 'rgba(214, 177, 122, 0.45)'
      ctx.lineWidth = Math.max(1.5, W * 0.0018)
      ctx.strokeRect(W * 0.04, H * 0.07, W * 0.92, H * 0.86)

      // Top-left coffee bean emblem + gold accent rule
      drawCoffeeBeanIcon(ctx, W * 0.11, H * 0.24, H * 0.058, cream, '#240F09')
      ctx.strokeStyle = 'rgba(214, 177, 122, 0.75)'
      ctx.lineWidth = Math.max(1.5, W * 0.0016)
      ctx.beginPath()
      ctx.moveTo(W * 0.155, H * 0.24)
      ctx.lineTo(W * 0.36, H * 0.24)
      ctx.stroke()

      // High-contrast champagne serif brand wordmark
      ctx.fillStyle = cream
      ctx.textAlign = 'left'
      if (line2) {
        ctx.font = `600 ${Math.round(H * 0.068)}px "Playfair Display", Georgia, serif`
        ctx.fillText(line1.split('').join(' '), W * 0.085, H * 0.42)
        ctx.font = `700 ${Math.round(H * 0.195)}px "Playfair Display", Georgia, serif`
        ctx.fillText(line2, W * 0.082, H * 0.61, W * 0.56)
      } else {
        ctx.font = `700 ${Math.round(H * 0.17)}px "Playfair Display", Georgia, serif`
        ctx.fillText(line1, W * 0.082, H * 0.55, W * 0.56)
      }

      // Italic tagline
      ctx.fillStyle = gold
      ctx.font = `italic 500 ${Math.round(H * 0.048)}px "Playfair Display", Georgia, serif`
      ctx.fillText('Nikmat di Setiap Senja', W * 0.085, H * 0.715)

      // Contact info row
      ctx.fillStyle = 'rgba(243, 223, 192, 0.85)'
      ctx.font = `500 ${Math.round(H * 0.032)}px "JetBrains Mono", monospace`
      ctx.fillText(`@${handleSlug}.id  ·  +62 812-3456-7890  ·  100% KOPI INDONESIA`, W * 0.085, H * 0.875, W * 0.83)
    } else if (vibe === 'Playful') {
      // Vibrant Tropical Card with Cream Rounded Panel & Mini Sunset Accent
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, colorHex)
      bg.addColorStop(1, '#3A1A10')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = '#FAF4E8'
      drawRoundedRect(ctx, W * 0.045, H * 0.075, W * 0.91, H * 0.85, W * 0.03)
      ctx.fill()

      // Right mini sunset panel inside card
      ctx.save()
      ctx.beginPath()
      drawRoundedRect(ctx, W * 0.64, H * 0.13, W * 0.27, H * 0.74, W * 0.022)
      ctx.clip()
      const sky = ctx.createLinearGradient(W * 0.77, H * 0.13, W * 0.77, H * 0.87)
      sky.addColorStop(0, '#FBE29D')
      sky.addColorStop(0.55, '#E99A42')
      sky.addColorStop(1, colorHex)
      ctx.fillStyle = sky
      ctx.fillRect(W * 0.64, H * 0.13, W * 0.27, H * 0.74)

      ctx.fillStyle = '#FFF5CC'
      ctx.beginPath()
      ctx.arc(W * 0.775, H * 0.48, H * 0.13, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#35180F'
      ctx.beginPath()
      ctx.moveTo(W * 0.64, H * 0.72)
      ctx.quadraticCurveTo(W * 0.775, H * 0.52, W * 0.91, H * 0.72)
      ctx.lineTo(W * 0.91, H * 0.87)
      ctx.lineTo(W * 0.64, H * 0.87)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      drawCoffeeBeanIcon(ctx, W * 0.12, H * 0.26, H * 0.056, colorHex, '#FAF4E8')
      ctx.fillStyle = '#2A130C'
      ctx.textAlign = 'left'
      ctx.font = `700 ${Math.round(H * 0.145)}px "Playfair Display", Georgia, serif`
      ctx.fillText(fullBrand, W * 0.09, H * 0.54, W * 0.52)

      ctx.fillStyle = '#6B4226'
      ctx.font = `italic 600 ${Math.round(H * 0.046)}px "Playfair Display", Georgia, serif`
      ctx.fillText('Nikmat di Setiap Senja', W * 0.09, H * 0.66)

      ctx.fillStyle = '#2A130C'
      ctx.font = `600 ${Math.round(H * 0.031)}px "JetBrains Mono", monospace`
      ctx.fillText(`@${handleSlug}.id  ·  +62 812-3456-7890`, W * 0.09, H * 0.81, W * 0.52)
    } else if (vibe === 'Premium') {
      // Deep Obsidian Matte Card with Champagne-Gold Double Border & Foil Medallion
      ctx.fillStyle = '#141215'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(214, 177, 122, 0.8)'
      ctx.lineWidth = Math.max(2, W * 0.0022)
      ctx.strokeRect(W * 0.04, H * 0.07, W * 0.92, H * 0.86)
      ctx.strokeStyle = 'rgba(214, 177, 122, 0.3)'
      ctx.lineWidth = Math.max(1, W * 0.0012)
      ctx.strokeRect(W * 0.052, H * 0.092, W * 0.896, H * 0.816)

      // Gold foil medallion on right
      const mx = W * 0.78
      const my = H * 0.48
      const mr = H * 0.21
      ctx.strokeStyle = gold
      ctx.lineWidth = Math.max(2, W * 0.002)
      ctx.beginPath()
      ctx.arc(mx, my, mr, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = gold
      ctx.beginPath()
      ctx.arc(mx, my + mr * 0.08, mr * 0.4, Math.PI, 0, false)
      ctx.fill()
      ctx.fillStyle = '#141215'
      ctx.beginPath()
      ctx.moveTo(mx - mr * 0.78, my + mr * 0.32)
      ctx.lineTo(mx - mr * 0.22, my - mr * 0.06)
      ctx.lineTo(mx + mr * 0.14, my + mr * 0.22)
      ctx.lineTo(mx + mr * 0.44, my - mr * 0.08)
      ctx.lineTo(mx + mr * 0.78, my + mr * 0.32)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      drawCoffeeBeanIcon(ctx, W * 0.115, H * 0.25, H * 0.052, gold, '#141215')
      ctx.fillStyle = gold
      ctx.textAlign = 'left'
      ctx.font = `600 ${Math.round(H * 0.032)}px "JetBrains Mono", monospace`
      ctx.fillText('RESERVE EDITION · SINGLE ORIGIN', W * 0.16, H * 0.265)

      ctx.fillStyle = cream
      ctx.font = `700 ${Math.round(H * 0.155)}px "Playfair Display", Georgia, serif`
      ctx.fillText(fullBrand, W * 0.09, H * 0.54, W * 0.54)

      ctx.fillStyle = gold
      ctx.font = `italic 500 ${Math.round(H * 0.046)}px "Playfair Display", Georgia, serif`
      ctx.fillText('Nikmat di Setiap Senja', W * 0.09, H * 0.66)

      ctx.fillStyle = 'rgba(214, 177, 122, 0.85)'
      ctx.font = `500 ${Math.round(H * 0.031)}px "JetBrains Mono", monospace`
      ctx.fillText(`@${handleSlug}.id  |  +62 812-3456-7890  |  100% KOPI INDONESIA`, W * 0.09, H * 0.83, W * 0.82)
    } else {
      // Retro Nusantara Parchment Card
      ctx.fillStyle = '#F3E5CE'
      ctx.fillRect(0, 0, W, H)

      const terracotta = colorHex === '#FFD84D' ? '#C66A2D' : colorHex
      ctx.strokeStyle = espresso
      ctx.lineWidth = Math.max(3, W * 0.0035)
      drawRoundedRect(ctx, W * 0.04, H * 0.07, W * 0.92, H * 0.86, W * 0.02)
      ctx.stroke()

      // Left vertical heritage ribbon
      ctx.fillStyle = terracotta
      ctx.fillRect(W * 0.04, H * 0.07, W * 0.08, H * 0.86)
      ctx.strokeStyle = espresso
      ctx.lineWidth = Math.max(2, W * 0.002)
      ctx.beginPath()
      ctx.moveTo(W * 0.12, H * 0.07)
      ctx.lineTo(W * 0.12, H * 0.93)
      ctx.stroke()

      drawCoffeeBeanIcon(ctx, W * 0.19, H * 0.25, H * 0.052, espresso, '#F3E5CE')
      ctx.fillStyle = espresso
      ctx.textAlign = 'left'
      ctx.font = `700 ${Math.round(H * 0.033)}px "JetBrains Mono", monospace`
      ctx.fillText('RACIKAN KLASIK NUSANTARA', W * 0.235, H * 0.265)

      ctx.font = `700 ${Math.round(H * 0.155)}px "Playfair Display", Georgia, serif`
      ctx.fillText(fullBrand, W * 0.17, H * 0.54, W * 0.74)

      ctx.fillStyle = terracotta
      ctx.font = `italic 600 ${Math.round(H * 0.048)}px "Playfair Display", Georgia, serif`
      ctx.fillText('Nikmat di Setiap Senja', W * 0.17, H * 0.66)

      ctx.fillStyle = espresso
      ctx.font = `700 ${Math.round(H * 0.031)}px "JetBrains Mono", monospace`
      ctx.fillText(`@${handleSlug}.id  ·  +62 812-3456-7890  ·  100% KOPI INDONESIA`, W * 0.17, H * 0.83, W * 0.75)
    }

    applyPaperGrain(ctx, W, H, 0.04)
    return canvas
  }

  if (layout === 'sticker') {
    // Kiss-cut glossy vinyl sticker sheet with 6 die-cut stickers
    const W = Math.round(1024 * sizeScale)
    const H = Math.round(1024 * sizeScale)
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Backing release liner sheet
    ctx.fillStyle = '#EFECE4'
    ctx.fillRect(0, 0, W, H)

    // Subtle sheet header strip
    ctx.fillStyle = '#8A857B'
    ctx.font = `600 ${Math.round(W * 0.02)}px "JetBrains Mono", monospace`
    ctx.textAlign = 'between' as CanvasTextAlign
    ctx.textAlign = 'left'
    ctx.fillText('ARC LAB KISS-CUT VINYL SHEET', W * 0.07, H * 0.055)

    const [line1, line2] = splitBrandLines(brand)
    const shortBrand = line1.slice(0, 12)
    const onCol = contrastInk(colorHex)

    const cols = [W * 0.28, W * 0.72]
    const rows = [H * 0.23, H * 0.53, H * 0.82]

    const drawDieCutOutline = (drawShape: () => void, fill: string) => {
      ctx.save()
      // Subtle kiss-cut shadow line
      ctx.shadowColor = 'rgba(0,0,0,0.12)'
      ctx.shadowBlur = 8 * sizeScale
      ctx.shadowOffsetY = 2 * sizeScale
      drawShape()
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.restore()

      ctx.save()
      drawShape()
      ctx.lineWidth = Math.max(1.5, 2 * sizeScale)
      ctx.strokeStyle = 'rgba(0,0,0,0.14)'
      ctx.stroke()
      ctx.restore()

      ctx.save()
      drawShape()
      ctx.fillStyle = fill
      ctx.fill()
      ctx.restore()
    }

    // Sticker 1: Round Brand Emblem
    const r1 = W * 0.145
    drawDieCutOutline(() => {
      ctx.beginPath()
      ctx.arc(cols[0], rows[0], r1 + W * 0.018, 0, Math.PI * 2)
    }, '#FFFFFF')
    ctx.fillStyle = colorHex
    ctx.beginPath()
    ctx.arc(cols[0], rows[0], r1, 0, Math.PI * 2)
    ctx.fill()
    drawSenjaBrandMark(ctx, cols[0], rows[0] - r1 * 0.18, r1 * 0.34, onCol, onCol)
    ctx.fillStyle = onCol
    ctx.textAlign = 'center'
    ctx.font = `700 ${Math.round(W * 0.032)}px "Space Grotesk", sans-serif`
    ctx.fillText(shortBrand, cols[0], rows[0] + r1 * 0.48, r1 * 1.65)

    // Sticker 2: Pill Wordmark
    const pw = W * 0.34
    const ph = H * 0.14
    drawDieCutOutline(() => {
      drawRoundedRect(ctx, cols[1] - pw * 0.5 - 12, rows[0] - ph * 0.5 - 12, pw + 24, ph + 24, (ph + 24) * 0.5)
    }, '#FFFFFF')
    ctx.fillStyle = '#18181C'
    drawRoundedRect(ctx, cols[1] - pw * 0.5, rows[0] - ph * 0.5, pw, ph, ph * 0.5)
    ctx.fill()
    ctx.fillStyle = '#FAF7F0'
    ctx.font = `700 ${Math.round(W * 0.036)}px "Space Grotesk", sans-serif`
    ctx.fillText(line2 ? `${line1} ${line2}` : line1, cols[1], rows[0] + W * 0.013, pw * 0.84)

    // Sticker 3: Rounded Square Mini Label
    const sq = W * 0.25
    drawDieCutOutline(() => {
      drawRoundedRect(ctx, cols[0] - sq * 0.5 - 12, rows[1] - sq * 0.5 - 12, sq + 24, sq + 24, 28 * sizeScale)
    }, '#FFFFFF')
    drawCoreFace(ctx, cols[0] - sq * 0.5, rows[1] - sq * 0.5, sq, sq, brand, vibe, colorHex, true)

    // Sticker 4: Oval Quality Seal
    const ow = W * 0.32
    const oh = H * 0.19
    drawDieCutOutline(() => {
      ctx.beginPath()
      ctx.ellipse(cols[1], rows[1], ow * 0.5 + 12, oh * 0.5 + 12, 0, 0, Math.PI * 2)
    }, '#FFFFFF')
    ctx.fillStyle = vibe === 'Premium' ? '#D6B676' : '#F6E27F'
    ctx.beginPath()
    ctx.ellipse(cols[1], rows[1], ow * 0.5, oh * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#18181C'
    ctx.font = `700 ${Math.round(W * 0.025)}px "JetBrains Mono", monospace`
    ctx.fillText('100% PRODUK ASLI', cols[1], rows[1] - W * 0.012, ow * 0.8)
    ctx.font = `700 ${Math.round(W * 0.032)}px "Space Grotesk", sans-serif`
    ctx.fillText(shortBrand, cols[1], rows[1] + W * 0.032, ow * 0.8)

    // Sticker 5: Stamp Ticket
    const tw = W * 0.31
    const th = H * 0.16
    drawDieCutOutline(() => {
      drawRoundedRect(ctx, cols[0] - tw * 0.5 - 12, rows[2] - th * 0.5 - 12, tw + 24, th + 24, 18 * sizeScale)
    }, '#FFFFFF')
    ctx.fillStyle = colorHex
    drawRoundedRect(ctx, cols[0] - tw * 0.5, rows[2] - th * 0.5, tw, th, 12 * sizeScale)
    ctx.fill()
    ctx.fillStyle = onCol
    ctx.font = `600 ${Math.round(W * 0.022)}px "JetBrains Mono", monospace`
    ctx.fillText('TERIMA KASIH DARI', cols[0], rows[2] - W * 0.016)
    ctx.font = `700 ${Math.round(W * 0.034)}px "Space Grotesk", sans-serif`
    ctx.fillText(shortBrand, cols[0], rows[2] + W * 0.028, tw * 0.84)

    // Sticker 6: Circle Arc Icon Seal
    const r6 = W * 0.115
    drawDieCutOutline(() => {
      ctx.beginPath()
      ctx.arc(cols[1], rows[2], r6 + 12 * sizeScale, 0, Math.PI * 2)
    }, '#FFFFFF')
    ctx.fillStyle = '#FAF7F0'
    ctx.beginPath()
    ctx.arc(cols[1], rows[2], r6, 0, Math.PI * 2)
    ctx.fill()
    drawSenjaBrandMark(ctx, cols[1], rows[2], r6 * 0.52, colorHex, '#18181C')

    applyPaperGrain(ctx, W, H, 0.03)
    return canvas
  }

  // Default: 'front' (18:26 commercial pouch & front-face aspect ratio at crisp high-res)
  const W = Math.round(1152 * sizeScale)
  const H = Math.round(1664 * sizeScale)
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  drawCoreFace(ctx, 0, 0, W, H, brand, vibe, colorHex, false)
  applyPaperGrain(ctx, W, H, 0.035)
  return canvas
}
