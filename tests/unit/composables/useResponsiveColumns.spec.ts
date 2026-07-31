import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DESKTOP_MAX_COLUMNS,
  MOBILE_MAX_COLUMNS,
  TABLET_LANDSCAPE_MAX_COLUMNS,
  TABLET_PORTRAIT_MAX_COLUMNS,
  useMaxColumns,
} from '@/composables/useResponsiveColumns'

function installViewport(width: number, orientation: 'landscape' | 'portrait'): void {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: matchesQuery(media, width, orientation),
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

function matchesQuery(
  media: string,
  width: number,
  orientation: 'landscape' | 'portrait',
): boolean {
  if (media.includes('orientation')) return media.includes(orientation)

  const min = /min-width:\s*(\d+)px/.exec(media)
  const max = /max-width:\s*(\d+)px/.exec(media)

  return (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMaxColumns', () => {
  it('caps a phone at two columns', () => {
    installViewport(375, 'portrait')

    expect(useMaxColumns().value).toBe(MOBILE_MAX_COLUMNS)
  })

  it('caps a tablet in portrait at two columns', () => {
    installViewport(768, 'portrait')

    expect(useMaxColumns().value).toBe(TABLET_PORTRAIT_MAX_COLUMNS)
  })

  it('allows three columns on a tablet in landscape', () => {
    installViewport(1024, 'landscape')

    expect(useMaxColumns().value).toBe(TABLET_LANDSCAPE_MAX_COLUMNS)
  })

  it('lifts the cap on desktop', () => {
    installViewport(1920, 'landscape')

    expect(useMaxColumns().value).toBe(DESKTOP_MAX_COLUMNS)
  })
})
