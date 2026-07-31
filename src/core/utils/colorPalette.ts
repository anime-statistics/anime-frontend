export type BrandShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

type Rgb = [number, number, number]

const WHITE_MIX: Partial<Record<BrandShade, number>> = {
  50: 0.94,
  100: 0.88,
  200: 0.75,
  300: 0.58,
  400: 0.32,
}

const BLACK_MIX: Partial<Record<BrandShade, number>> = {
  600: 0.14,
  700: 0.29,
  800: 0.43,
  900: 0.55,
}

export function hexToRgb(hex: string): Rgb | null {
  const match = hex.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!match) return null

  const value = match[1]
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function mix(base: Rgb, target: number, amount: number): Rgb {
  return base.map((channel) => Math.round(channel + (target - channel) * amount)) as Rgb
}

export function buildBrandPalette(hex: string): Record<BrandShade, string> | null {
  const base = hexToRgb(hex)
  if (!base) return null

  const shades = {} as Record<BrandShade, string>
  const allShades: BrandShade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

  for (const shade of allShades) {
    let rgb: Rgb = base
    const whiteAmount = WHITE_MIX[shade]
    const blackAmount = BLACK_MIX[shade]
    if (whiteAmount !== undefined) rgb = mix(base, 255, whiteAmount)
    else if (blackAmount !== undefined) rgb = mix(base, 0, blackAmount)

    // Space-separated triplets so Tailwind's `rgb(var(...) / <alpha-value>)` works.
    shades[shade] = rgb.join(' ')
  }

  return shades
}

export function applyBrandPalette(hex: string): boolean {
  const palette = buildBrandPalette(hex)
  if (!palette) return false

  for (const [shade, triplet] of Object.entries(palette)) {
    document.documentElement.style.setProperty(`--brand-${shade}`, triplet)
  }
  return true
}
