import { afterEach, describe, expect, it } from 'vitest'
import { abortAll, getAbortController, removeAbortController } from '@/apis/http/abortManager'

afterEach(() => {
  abortAll()
})

describe('getAbortController', () => {
  it('returns a fresh controller for a new key', () => {
    const controller = getAbortController('search')

    expect(controller.signal.aborted).toBe(false)
  })

  it('aborts the previous controller registered under the same key', () => {
    const first = getAbortController('search')
    const second = getAbortController('search')

    expect(first.signal.aborted).toBe(true)
    expect(second.signal.aborted).toBe(false)
  })

  it('keeps controllers for different keys independent', () => {
    const search = getAbortController('search')
    getAbortController('detail')

    expect(search.signal.aborted).toBe(false)
  })
})

describe('removeAbortController', () => {
  it('stops a later request from aborting the removed controller', () => {
    const first = getAbortController('search')
    removeAbortController('search')
    getAbortController('search')

    expect(first.signal.aborted).toBe(false)
  })
})

describe('abortAll', () => {
  it('aborts every pending controller', () => {
    const search = getAbortController('search')
    const detail = getAbortController('detail')

    abortAll()

    expect(search.signal.aborted).toBe(true)
    expect(detail.signal.aborted).toBe(true)
  })
})
