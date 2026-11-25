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

function drawArcBrandMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ringColor: string,
  dotColor: string
) {
  ctx.save()
  ctx.strokeStyle = ringColor
  ctx.lineWidth = Math.max(2.5, r * 0.24)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25)
  ctx.stroke()

  ctx.fillStyle = dotColor
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
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
    // Warm editorial cotton paper stock
    ctx.fillStyle = '#F8F5EE'
    ctx.fillRect(ox, oy, fw, fh)

    // Subtle accent band at top or bottom
    const pad = fw * 0.085
    ctx.fillStyle = colorHex
    ctx.fillRect(ox + pad, oy + pad, fw - pad * 2, fh * 0.032)

    // Hairline editorial grid rules
    ctx.strokeStyle = 'rgba(23, 22, 20, 0.22)'
    ctx.lineWidth = Math.max(1.5, fw * 0.0025)
    ctx.beginPath()
    ctx.moveTo(ox + pad, oy + fh * 0.22)
    ctx.lineTo(ox + fw - pad, oy + fh * 0.22)
    ctx.moveTo(ox + pad, oy + fh * 0.78)
    ctx.lineTo(ox + fw - pad, oy + fh * 0.78)
    ctx.stroke()

    // Micro studio header
    ctx.fillStyle = '#22201D'
    ctx.font = `600 ${Math.round(fw * 0.026)}px "JetBrains Mono", monospace`
    ctx.textAlign = 'left'
    ctx.fillText('PRODUK PILIHAN', ox + pad, oy + fh * 0.185)
    ctx.textAlign = 'right'
    ctx.fillText('NO. 01 / IDN', ox + fw - pad, oy + fh * 0.185)

    // Clean brand mark
    drawArcBrandMark(ctx, cx, oy + fh * (compact ? 0.36 : 0.38), fw * 0.068, '#1B1A18', colorHex)

    // Editorial Typography
    ctx.fillStyle = '#161514'
    ctx.textAlign = 'center'
    const fontSize = Math.round(fw * (line2 ? 0.095 : 0.105))
    ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
    if (line2) {
      ctx.fillText(line1, cx, oy + fh * 0.56, fw - pad * 2.2)
      ctx.fillText(line2, cx, oy + fh * 0.675, fw - pad * 2.2)
    } else {
      ctx.fillText(line1, cx, oy + fh * 0.61, fw - pad * 2.2)
    }

    if (!compact) {
      ctx.fillStyle = 'rgba(23, 22, 20, 0.65)'
      ctx.font = `500 ${Math.round(fw * 0.027)}px "Inter", sans-serif`
      ctx.fillText('Diracik dengan bahan pilihan berkualitas tinggi', cx, oy + fh * 0.735)
    }

    // Bottom specs
    ctx.fillStyle = '#22201D'
    ctx.font = `600 ${Math.round(fw * 0.025)}px "JetBrains Mono", monospace`
    ctx.textAlign = 'left'
    ctx.fillText('BERAT BERSIH 250G', ox + pad, oy + fh * 0.855)
    ctx.textAlign = 'right'
    ctx.fillStyle = colorHex === '#FFD84D' ? '#1B1A18' : colorHex
    ctx.fillText('KUALITAS UTAMA', ox + fw - pad, oy + fh * 0.855)
  } else if (vibe === 'Playful') {
    // Rich full-bleed color stock with arched cream window
    ctx.fillStyle = colorHex
    ctx.fillRect(ox, oy, fw, fh)

    // Subtle organic botanical circles in background tone
    ctx.fillStyle = onColor === '#FAF7F0' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'
    ctx.beginPath()
    ctx.arc(ox + fw * 0.15, oy + fh * 0.18, fw * 0.22, 0, Math.PI * 2)
    ctx.arc(ox + fw * 0.88, oy + fh * 0.82, fw * 0.26, 0, Math.PI * 2)
    ctx.fill()

    // Cream arched window
    const winW = fw * 0.78
    const winH = fh * 0.76
    const wx = ox + (fw - winW) * 0.5
    const wy = oy + (fh - winH) * 0.52
    const archR = winW * 0.42

    ctx.fillStyle = '#FAF6EC'
    drawRoundedRect(ctx, wx, wy, winW, winH, archR * 0.45)
    ctx.fill()

    // Fine inset keyline
    ctx.strokeStyle = colorHex
    ctx.lineWidth = Math.max(2, fw * 0.005)
    drawRoundedRect(ctx, wx + fw * 0.02, wy + fw * 0.02, winW - fw * 0.04, winH - fw * 0.04, archR * 0.4)
    ctx.stroke()

    // Playful pill tag
    const pillW = fw * 0.36
    const pillH = fh * 0.062
    ctx.fillStyle = '#191816'
    drawRoundedRect(ctx, cx - pillW * 0.5, wy + winH * 0.12, pillW, pillH, pillH * 0.5)
    ctx.fill()
    ctx.fillStyle = '#FAF6EC'
    ctx.textAlign = 'center'
    ctx.font = `600 ${Math.round(fw * 0.024)}px "JetBrains Mono", monospace`
    ctx.fillText('RASA ASLI LOKAL', cx, wy + winH * 0.162)

    // Playful geometric emblem
    drawArcBrandMark(ctx, cx, wy + winH * 0.34, fw * 0.065, colorHex, '#191816')

    // Bold expressive brand name
    ctx.fillStyle = '#191816'
    const fontSize = Math.round(fw * (line2 ? 0.096 : 0.106))
    ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
    if (line2) {
      ctx.fillText(line1, cx, wy + winH * 0.57, winW * 0.84)
      ctx.fillText(line2, cx, wy + winH * 0.71, winW * 0.84)
    } else {
      ctx.fillText(line1, cx, wy + winH * 0.63, winW * 0.84)
    }

    if (!compact) {
      ctx.fillStyle = '#4A4640'
      ctx.font = `600 ${Math.round(fw * 0.026)}px "Inter", sans-serif`
      ctx.fillText('Segar · Alami · Siap Menemani Harimu', cx, wy + winH * 0.85)
    }
  } else if (vibe === 'Premium') {
    // Deep matte obsidian stock with champagne foil & accent trim
    ctx.fillStyle = '#161619'
    ctx.fillRect(ox, oy, fw, fh)

    // Subtle top/bottom color silk ribbon
    ctx.fillStyle = colorHex
    ctx.fillRect(ox, oy, fw, fh * 0.028)
    ctx.fillRect(ox, oy + fh * 0.972, fw, fh * 0.028)

    const pad = fw * 0.09
    const gold = '#D6B676'
    ctx.strokeStyle = gold
    ctx.lineWidth = Math.max(1.5, fw * 0.003)
    ctx.strokeRect(ox + pad, oy + pad, fw - pad * 2, fh - pad * 2)
    ctx.lineWidth = Math.max(1, fw * 0.0015)
    ctx.strokeRect(ox + pad * 1.18, oy + pad * 1.18, fw - pad * 2.36, fh - pad * 2.36)

    // Gold crest mark
    drawArcBrandMark(ctx, cx, oy + fh * 0.31, fw * 0.062, gold, colorHex)

    ctx.fillStyle = gold
    ctx.textAlign = 'center'
    ctx.font = `600 ${Math.round(fw * 0.024)}px "JetBrains Mono", monospace`
    ctx.fillText('EDISI ARTISAN TERBATAS', cx, oy + fh * 0.45)

    // Crisp ivory brand name
    ctx.fillStyle = '#F6F2E9'
    const fontSize = Math.round(fw * (line2 ? 0.09 : 0.1))
    ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
    if (line2) {
      ctx.fillText(line1, cx, oy + fh * 0.585, fw - pad * 3)
      ctx.fillText(line2, cx, oy + fh * 0.695, fw - pad * 3)
    } else {
      ctx.fillText(line1, cx, oy + fh * 0.63, fw - pad * 3)
    }

    // Fine gold divider
    ctx.strokeStyle = gold
    ctx.beginPath()
    ctx.moveTo(cx - fw * 0.12, oy + fh * 0.76)
    ctx.lineTo(cx + fw * 0.12, oy + fh * 0.76)
    ctx.stroke()

    if (!compact) {
      ctx.fillStyle = 'rgba(246, 242, 233, 0.72)'
      ctx.font = `500 ${Math.round(fw * 0.024)}px "JetBrains Mono", monospace`
      ctx.fillText('KUALITAS EKSPOR · INDONESIA', cx, oy + fh * 0.83)
    }
  } else {
    // Retro Heritage Cream Stock with Warm Banding
    ctx.fillStyle = '#F2E7D3'
    ctx.fillRect(ox, oy, fw, fh)

    const pad = fw * 0.075
    // Heritage triple stripe band across middle
    ctx.fillStyle = colorHex
    ctx.fillRect(ox + pad, oy + fh * 0.46, fw - pad * 2, fh * 0.24)
    ctx.fillStyle = '#26211D'
    ctx.fillRect(ox + pad, oy + fh * 0.44, fw - pad * 2, fh * 0.012)
    ctx.fillRect(ox + pad, oy + fh * 0.708, fw - pad * 2, fh * 0.012)

    // Vintage apothecary outer frame
    ctx.strokeStyle = '#26211D'
    ctx.lineWidth = Math.max(2.5, fw * 0.0055)
    drawRoundedRect(ctx, ox + pad, oy + pad, fw - pad * 2, fh - pad * 2, fw * 0.03)
    ctx.stroke()

    ctx.fillStyle = '#26211D'
    ctx.textAlign = 'center'
    ctx.font = `700 ${Math.round(fw * 0.027)}px "JetBrains Mono", monospace`
    ctx.fillText('RESEP WARISAN NUSANTARA', cx, oy + fh * 0.19)

    drawArcBrandMark(ctx, cx, oy + fh * 0.31, fw * 0.056, '#26211D', colorHex)

    // Brand name inside color band
    ctx.fillStyle = onColor
    const fontSize = Math.round(fw * (line2 ? 0.088 : 0.102))
    ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
    if (line2) {
      ctx.fillText(line1, cx, oy + fh * 0.565, fw - pad * 2.6)
      ctx.fillText(line2, cx, oy + fh * 0.665, fw - pad * 2.6)
    } else {
      ctx.fillText(line1, cx, oy + fh * 0.615, fw - pad * 2.6)
    }

    ctx.fillStyle = '#26211D'
    ctx.font = `700 ${Math.round(fw * 0.026)}px "JetBrains Mono", monospace`
    ctx.fillText('SEJAK 2026 · 100% OTENTIK', cx, oy + fh * 0.83)
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
        ? '#F8F5EE'
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
    const ink = vibe === 'Premium' ? '#E5E0D5' : vibe === 'Playful' ? contrastInk(colorHex) : '#262320'
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
    // Business card (1.75 : 1)
    const W = Math.round(1024 * sizeScale)
    const H = Math.round(586 * sizeScale)
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const [line1, line2] = splitBrandLines(brand)
    const fullBrand = line2 ? `${line1} ${line2}` : line1

    if (vibe === 'Premium') {
      ctx.fillStyle = '#17171B'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#D6B676'
      ctx.lineWidth = Math.max(2, W * 0.003)
      ctx.strokeRect(W * 0.045, H * 0.075, W * 0.91, H * 0.85)
    } else if (vibe === 'Playful') {
      ctx.fillStyle = colorHex
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#FAF7F0'
      drawRoundedRect(ctx, W * 0.05, H * 0.08, W * 0.9, H * 0.84, W * 0.025)
      ctx.fill()
    } else {
      ctx.fillStyle = vibe === 'Retro' ? '#F2E7D3' : '#FAF8F3'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = colorHex
      ctx.fillRect(0, 0, W * 0.032, H)
    }

    const fg = vibe === 'Premium' ? '#F6F2E9' : '#181715'
    const subFg = vibe === 'Premium' ? '#D6B676' : '#57534E'

    drawArcBrandMark(ctx, W * 0.14, H * 0.3, W * 0.052, vibe === 'Premium' ? '#D6B676' : colorHex, fg)

    ctx.textAlign = 'left'
    ctx.fillStyle = fg
    ctx.font = `700 ${Math.round(W * 0.068)}px "Space Grotesk", sans-serif`
    ctx.fillText(fullBrand, W * 0.09, H * 0.62, W * 0.82)

    ctx.fillStyle = subFg
    ctx.font = `500 ${Math.round(W * 0.024)}px "JetBrains Mono", monospace`
    ctx.fillText('PRODUK LOKAL INDONESIA  ·  @BRAND.ID  ·  +62 812-3456-7890', W * 0.09, H * 0.78, W * 0.82)

    applyPaperGrain(ctx, W, H, 0.055)
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
    drawArcBrandMark(ctx, cols[0], rows[0] - r1 * 0.18, r1 * 0.34, onCol, onCol)
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
    drawArcBrandMark(ctx, cols[1], rows[2], r6 * 0.52, colorHex, '#18181C')

    applyPaperGrain(ctx, W, H, 0.03)
    return canvas
  }

  // Default: 'front' (1:1 for boxes, pouches, tote bags, paper bags)
  const W = Math.round(1024 * sizeScale)
  const H = Math.round(1024 * sizeScale)
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  drawCoreFace(ctx, 0, 0, W, H, brand, vibe, colorHex, false)
  applyPaperGrain(ctx, W, H, 0.05)
  return canvas
}
