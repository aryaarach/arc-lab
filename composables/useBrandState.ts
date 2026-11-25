export type VibeType = 'Minimalis' | 'Playful' | 'Premium' | 'Retro'
export type FinishType = 'Glossy' | 'Matte' | 'Kraft'
export type ProductId =
  | 'box'
  | 'can'
  | 'cup'
  | 'bottle'
  | 'jar'
  | 'pouch'
  | 'tote'
  | 'paperbag'
  | 'card'
  | 'sticker'

export type BackdropId = 'kertas' | 'beton' | 'krem' | 'hitam' | 'pink' | 'biru'
export type LabelLayout = 'wrap' | 'front' | 'card' | 'sticker'

export interface ProductMeta {
  id: ProductId
  name: string
  shortName: string
  category: string
  layout: LabelLayout
}

export interface ColorSwatchMeta {
  name: string
  hex: string
}

export interface BackdropMeta {
  id: BackdropId
  name: string
  hex: string
  isDark?: boolean
}

export const PRODUCT_CATALOG: ProductMeta[] = [
  { id: 'pouch', name: 'Pouch Standing', shortName: 'Pouch', category: 'Snack & Kopi', layout: 'front' },
  { id: 'box', name: 'Box Kemasan', shortName: 'Box', category: 'Ritel & Skincare', layout: 'front' },
  { id: 'can', name: 'Kaleng Minuman', shortName: 'Kaleng', category: 'RTD & Soda', layout: 'wrap' },
  { id: 'cup', name: 'Cup Minuman', shortName: 'Cup', category: 'Kafe & Teh', layout: 'wrap' },
  { id: 'bottle', name: 'Botol Kaca', shortName: 'Botol', category: 'Kopi Dingin & Sirup', layout: 'wrap' },
  { id: 'jar', name: 'Toples Kaca', shortName: 'Toples', category: 'Sambal & Selai', layout: 'wrap' },
  { id: 'tote', name: 'Tote Bag Kanvas', shortName: 'Tote Bag', category: 'Merchandise', layout: 'front' },
  { id: 'paperbag', name: 'Paper Bag Toko', shortName: 'Paper Bag', category: 'Butik & Hampers', layout: 'front' },
  { id: 'card', name: 'Kartu Nama', shortName: 'Kartu Nama', category: 'Identitas Bisnis', layout: 'card' },
  { id: 'sticker', name: 'Sticker Sheet', shortName: 'Stiker', category: 'Segel & Promosi', layout: 'sticker' }
]

export const VIBE_LIST: { id: VibeType; desc: string }[] = [
  { id: 'Minimalis', desc: 'Bersih, editorial, modern' },
  { id: 'Playful', desc: 'Segar, ekspresif, kontras' },
  { id: 'Premium', desc: 'Gelap elegan, aksen emas' },
  { id: 'Retro', desc: 'Klasik hangat Nusantara' }
]

export const FINISH_LIST: { id: FinishType; label: string; desc: string }[] = [
  { id: 'Glossy', label: 'Glossy', desc: 'Kilap jernih' },
  { id: 'Matte', label: 'Matte', desc: 'Halus lembut' },
  { id: 'Kraft', label: 'Kraft', desc: 'Serat kertas alami' }
]

export const BRAND_SWATCHES: ColorSwatchMeta[] = [
  { name: 'Koral Terakota', hex: '#FF6B4A' },
  { name: 'Indigo Studio', hex: '#5B5BFF' },
  { name: 'Sian Segar', hex: '#22E6D0' },
  { name: 'Kuning Kunyit', hex: '#FFD84D' },
  { name: 'Hijau Daun', hex: '#1F7A5C' },
  { name: 'Arang Klasik', hex: '#1F2028' }
]

export const BACKDROP_PRESETS: BackdropMeta[] = [
  { id: 'kertas', name: 'Kertas', hex: '#F4F1EA' },
  { id: 'beton', name: 'Abu Beton', hex: '#BFBDB8' },
  { id: 'krem', name: 'Krem', hex: '#E9DFCB' },
  { id: 'hitam', name: 'Hitam Studio', hex: '#17171B', isDark: true },
  { id: 'pink', name: 'Pink Pastel', hex: '#F2C9C2' },
  { id: 'biru', name: 'Biru Pastel', hex: '#BCD3EE' }
]

export function useBrandState() {
  const brandName = useState<string>('arc-brand-name', () => 'KOPI SENJA')
  const vibe = useState<VibeType>('arc-brand-vibe', () => 'Minimalis')
  const colorHex = useState<string>('arc-brand-color', () => '#FF6B4A')
  const finish = useState<FinishType>('arc-brand-finish', () => 'Matte')
  const productId = useState<ProductId>('arc-brand-product', () => 'pouch')
  const backdropId = useState<BackdropId>('arc-brand-backdrop', () => 'kertas')

  function setBrandName(val: string) {
    brandName.value = val.slice(0, 18)
  }

  function cycleBrandColor() {
    const idx = BRAND_SWATCHES.findIndex((s) => s.hex.toLowerCase() === colorHex.value.toLowerCase())
    const next = BRAND_SWATCHES[(idx + 1) % BRAND_SWATCHES.length]
    colorHex.value = next.hex
  }

  function randomizeBrandSetup() {
    const pick = <T>(arr: T[], current?: T): T => {
      const pool = arr.length > 1 && current !== undefined ? arr.filter((x) => x !== current) : arr
      return pool[Math.floor(Math.random() * pool.length)]
    }
    vibe.value = pick(VIBE_LIST.map((v) => v.id), vibe.value)
    colorHex.value = pick(BRAND_SWATCHES.map((c) => c.hex), colorHex.value)
    finish.value = pick(FINISH_LIST.map((f) => f.id), finish.value)
    productId.value = pick(PRODUCT_CATALOG.map((p) => p.id), productId.value)
    backdropId.value = pick(BACKDROP_PRESETS.map((b) => b.id), backdropId.value)
  }

  return {
    brandName,
    vibe,
    colorHex,
    finish,
    productId,
    backdropId,
    setBrandName,
    cycleBrandColor,
    randomizeBrandSetup
  }
}
