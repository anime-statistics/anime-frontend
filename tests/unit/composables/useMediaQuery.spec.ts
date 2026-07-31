import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsDesktop, useIsMobile, useMediaQuery } from '@/composables/useMediaQuery'

interface FakeMediaQueryList {
  matches: boolean
  media: string
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  emit: (matches: boolean) => void
}

const created: FakeMediaQueryList[] = []

function installMatchMedia(initialMatches: boolean): void {
  vi.stubGlobal('matchMedia', (media: string) => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined
    const list: FakeMediaQueryList = {
      matches: initialMatches,
      media,
      addEventListener: vi.fn((_type: string, handler: (event: MediaQueryListEvent) => void) => {
        listener = handler
      }),
      removeEventListener: vi.fn(() => {
        listener = undefined
      }),
      emit: (matches: boolean) => {
        listener?.({ matches } as MediaQueryListEvent)
      },
    }
    created.push(list)
    return list
  })
}

beforeEach(() => {
  created.length = 0
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useMediaQuery', () => {
  it('seeds the ref from the current match state', () => {
    installMatchMedia(true)

    expect(useMediaQuery('(min-width: 1024px)').value).toBe(true)
  })

  it('updates after the debounce window when the query changes', () => {
    installMatchMedia(false)
    const matches = useMediaQuery('(min-width: 1024px)')

    created[0].emit(true)
    expect(matches.value).toBe(false)

    vi.advanceTimersByTime(60)
    expect(matches.value).toBe(true)
  })

  it('coalesces rapid changes into the final value', () => {
    installMatchMedia(false)
    const matches = useMediaQuery('(min-width: 1024px)')

    created[0].emit(true)
    vi.advanceTimersByTime(10)
    created[0].emit(false)
    vi.advanceTimersByTime(60)

    expect(matches.value).toBe(false)
  })

  it('detaches the listener when the scope is disposed', () => {
    installMatchMedia(false)
    const scope = effectScope()
    scope.run(() => useMediaQuery('(min-width: 1024px)'))

    scope.stop()

    expect(created[0].removeEventListener).toHaveBeenCalled()
  })

  it('stays false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(useMediaQuery('(min-width: 1024px)').value).toBe(false)
  })
})

describe('breakpoint helpers', () => {
  it('uses the documented breakpoints', () => {
    installMatchMedia(false)

    useIsMobile()
    useIsDesktop()

    expect(created.map((list) => list.media)).toEqual([
      '(max-width: 767px)',
      '(min-width: 1024px)',
    ])
  })
})
