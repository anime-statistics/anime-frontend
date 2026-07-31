import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHaptic } from '@/composables/useHaptic'

function installVibrate(): ReturnType<typeof vi.fn> {
  const vibrate = vi.fn()
  vi.stubGlobal('navigator', { vibrate })
  return vibrate
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useHaptic', () => {
  it('reports support when the API is present', () => {
    installVibrate()

    expect(useHaptic().isSupported).toBe(true)
  })

  it('reports no support when the API is missing', () => {
    vi.stubGlobal('navigator', {})

    expect(useHaptic().isSupported).toBe(false)
  })

  it('fires the documented durations', () => {
    const vibrate = installVibrate()
    const haptic = useHaptic()

    haptic.lightTap()
    haptic.mediumTap()
    haptic.success()
    haptic.error()

    expect(vibrate.mock.calls).toEqual([[10], [20], [30], [[50, 100, 50]]])
  })

  it('stays silent instead of throwing when vibration is unsupported', () => {
    vi.stubGlobal('navigator', {})
    const haptic = useHaptic()

    expect(() => haptic.success()).not.toThrow()
  })
})
