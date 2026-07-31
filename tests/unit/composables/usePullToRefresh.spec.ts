import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PULL_THRESHOLD_PX, usePullToRefresh } from '@/composables/usePullToRefresh'

function touchAt(clientY: number): TouchEvent {
  return { touches: [{ clientY }] } as unknown as TouchEvent
}

function setScrollY(value: number): void {
  Object.defineProperty(window, 'scrollY', { value, configurable: true })
}

beforeEach(() => {
  setScrollY(0)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePullToRefresh', () => {
  it('tracks the pull with resistance applied', () => {
    const pull = usePullToRefresh(() => Promise.resolve())

    pull.onTouchStart(touchAt(0))
    pull.onTouchMove(touchAt(100))

    expect(pull.isPulling.value).toBe(true)
    expect(pull.pullDistance.value).toBe(50)
  })

  it('caps the progress at one once the threshold is reached', () => {
    const pull = usePullToRefresh(() => Promise.resolve())

    pull.onTouchStart(touchAt(0))
    pull.onTouchMove(touchAt(400))

    expect(pull.pullDistance.value).toBeGreaterThanOrEqual(PULL_THRESHOLD_PX)
    expect(pull.progress.value).toBe(1)
  })

  it('refreshes when the gesture passes the threshold', async () => {
    const refresh = vi.fn(() => Promise.resolve())
    const pull = usePullToRefresh(refresh)

    pull.onTouchStart(touchAt(0))
    pull.onTouchMove(touchAt(400))
    pull.onTouchEnd()

    expect(refresh).toHaveBeenCalledOnce()
    expect(pull.isRefreshing.value).toBe(true)

    await vi.waitFor(() => expect(pull.isRefreshing.value).toBe(false))
    expect(pull.pullDistance.value).toBe(0)
  })

  it('does not refresh a short pull', () => {
    const refresh = vi.fn(() => Promise.resolve())
    const pull = usePullToRefresh(refresh)

    pull.onTouchStart(touchAt(0))
    pull.onTouchMove(touchAt(20))
    pull.onTouchEnd()

    expect(refresh).not.toHaveBeenCalled()
    expect(pull.pullDistance.value).toBe(0)
  })

  it('ignores a gesture that starts below the top of the page', () => {
    setScrollY(400)
    const pull = usePullToRefresh(() => Promise.resolve())

    pull.onTouchStart(touchAt(0))
    pull.onTouchMove(touchAt(400))

    expect(pull.pullDistance.value).toBe(0)
  })

  it('ignores an upward drag', () => {
    const pull = usePullToRefresh(() => Promise.resolve())

    pull.onTouchStart(touchAt(200))
    pull.onTouchMove(touchAt(100))

    expect(pull.isPulling.value).toBe(false)
    expect(pull.pullDistance.value).toBe(0)
  })

  it('clears the refreshing flag when the refresh rejects', async () => {
    const pull = usePullToRefresh(() => Promise.reject(new Error('offline')))

    pull.onTouchStart(touchAt(0))
    pull.onTouchMove(touchAt(400))
    pull.onTouchEnd()

    await vi.waitFor(() => expect(pull.isRefreshing.value).toBe(false))
  })
})
