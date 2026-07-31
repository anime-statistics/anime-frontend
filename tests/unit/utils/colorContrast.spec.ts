import { describe, expect, it } from 'vitest'
import { contrastRatio, DARK_TEXT, LIGHT_TEXT, readableTextColor } from '@/core/utils/colorPalette'

describe('contrastRatio', () => {
  it('returns 21 for black against white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('returns 1 for a colour against itself', () => {
    expect(contrastRatio('#6366f1', '#6366f1')).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#ffffff', '#f59e0b')).toBeCloseTo(contrastRatio('#f59e0b', '#ffffff'), 5)
  })

  it('falls back to 1 for an unparsable colour', () => {
    expect(contrastRatio('nope', '#ffffff')).toBe(1)
    expect(contrastRatio('#ffffff', 'rgb(0,0,0)')).toBe(1)
  })
})

describe('readableTextColor', () => {
  it('picks light text on a dark background', () => {
    expect(readableTextColor('#312e81')).toBe(LIGHT_TEXT)
  })

  it('picks dark text on a light background', () => {
    expect(readableTextColor('#fde68a')).toBe(DARK_TEXT)
  })

  it.each(['#f59e0b', '#14b8a6', '#ef4444', '#84cc16', '#6366f1', '#ec4899'])(
    'clears the 4.5:1 floor on %s',
    (background) => {
      expect(contrastRatio(readableTextColor(background), background)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('prefers dark text once it wins on contrast', () => {
    // Amber sits just below the old 0.45 luminance cut-off, which is exactly
    // where the previous threshold picked unreadable white text.
    expect(readableTextColor('#f59e0b')).toBe(DARK_TEXT)
  })
})
