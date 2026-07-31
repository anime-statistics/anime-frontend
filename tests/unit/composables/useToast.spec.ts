import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from '@/composables/useToast'

beforeEach(() => {
  vi.useFakeTimers()
  useToast().clear()
})

afterEach(() => {
  useToast().clear()
  vi.useRealTimers()
})

describe('useToast', () => {
  it('starts empty', () => {
    expect(useToast().toasts.value).toEqual([])
  })

  it('adds an info toast by default', () => {
    const toast = useToast()

    toast.show('Сохранено')

    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0].severity).toBe('info')
    expect(toast.toasts.value[0].message).toBe('Сохранено')
  })

  it('exposes success and error shorthands', () => {
    const toast = useToast()

    toast.success('ok')
    toast.error('boom')

    expect(toast.toasts.value.map((entry) => entry.severity)).toEqual(['success', 'error'])
  })

  it('auto-dismisses after the default duration', () => {
    const toast = useToast()
    toast.success('ok')

    vi.advanceTimersByTime(3000)

    expect(toast.toasts.value).toEqual([])
  })

  it('keeps a toast with a zero duration until dismissed', () => {
    const toast = useToast()
    const id = toast.show('sticky', 'info', 0)

    vi.advanceTimersByTime(60_000)
    expect(toast.toasts.value).toHaveLength(1)

    toast.dismiss(id)
    expect(toast.toasts.value).toEqual([])
  })

  it('shares state between call sites', () => {
    useToast().success('first')

    expect(useToast().toasts.value).toHaveLength(1)
  })

  it('gives every toast a distinct id', () => {
    const toast = useToast()

    const first = toast.show('a', 'info', 0)
    const second = toast.show('b', 'info', 0)

    expect(first).not.toBe(second)
  })
})
