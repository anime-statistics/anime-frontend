import { afterEach, describe, expect, it, vi } from 'vitest'
import { FILTER_WORKER_THRESHOLD, useFilterWorker } from '@/composables/useFilterWorker'
import type { IFilterableItem, IParsedFilters } from '@/core/utils/filterParser'

interface ITestItem extends IFilterableItem {
  title: string
}

const items: ITestItem[] = [
  { title: 'Naruto', genres: ['Action'], myTags: ['completed'], airedFrom: '2002-10-03' },
  { title: 'Frieren', genres: ['Adventure'], myTags: ['watching'], airedFrom: '2023-09-29' },
]

const EMPTY_FILTERS: IParsedFilters = { freeText: '' }

class FakeWorker implements Pick<Worker, 'addEventListener' | 'removeEventListener' | 'terminate'> {
  static instances: FakeWorker[] = []

  listeners = new Map<string, Set<EventListenerOrEventListenerObject>>()
  posted: unknown[] = []
  terminated = false

  constructor() {
    FakeWorker.instances.push(this)
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const set = this.listeners.get(type) ?? new Set()
    set.add(listener)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener)
  }

  postMessage(message: unknown): void {
    this.posted.push(message)
  }

  terminate(): void {
    this.terminated = true
  }

  emit(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) {
      ;(listener as (value: unknown) => void)(event)
    }
  }
}

function installWorker(): void {
  FakeWorker.instances = []
  vi.stubGlobal('Worker', FakeWorker)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFilterWorker.filterItems', () => {
  it('filters small lists on the main thread without spawning a worker', async () => {
    installWorker()
    const { filterItems } = useFilterWorker()

    const result = await filterItems(items, { freeText: '', genre: 'action' })

    expect(result.map((item) => item.title)).toEqual(['Naruto'])
    expect(FakeWorker.instances).toHaveLength(0)
  })

  it('returns everything when no filter is set', async () => {
    installWorker()
    const { filterItems } = useFilterWorker()

    expect(await filterItems(items, EMPTY_FILTERS)).toHaveLength(2)
  })

  it('hands lists past the threshold to the worker', async () => {
    installWorker()
    const { filterItems } = useFilterWorker()
    const many = Array.from({ length: FILTER_WORKER_THRESHOLD + 1 }, () => items[0])

    const pending = filterItems(many, EMPTY_FILTERS)
    FakeWorker.instances[0].emit('message', { data: [items[0]] })

    expect(await pending).toEqual([items[0]])
  })
})

describe('useFilterWorker.filterInWorker', () => {
  it('posts the payload and resolves with the worker result', async () => {
    installWorker()
    const { filterInWorker } = useFilterWorker()

    const pending = filterInWorker(items, EMPTY_FILTERS)
    expect(FakeWorker.instances[0].posted).toEqual([{ items, filters: EMPTY_FILTERS }])

    FakeWorker.instances[0].emit('message', { data: items })
    expect(await pending).toEqual(items)
  })

  it('rejects when the worker errors', async () => {
    installWorker()
    const { filterInWorker } = useFilterWorker()

    const pending = filterInWorker(items, EMPTY_FILTERS)
    FakeWorker.instances[0].emit('error', { message: 'worker exploded' })

    await expect(pending).rejects.toThrow('worker exploded')
  })

  it('detaches its listeners once settled', async () => {
    installWorker()
    const { filterInWorker } = useFilterWorker()

    const pending = filterInWorker(items, EMPTY_FILTERS)
    FakeWorker.instances[0].emit('message', { data: items })
    await pending

    expect(FakeWorker.instances[0].listeners.get('message')?.size ?? 0).toBe(0)
    expect(FakeWorker.instances[0].listeners.get('error')?.size ?? 0).toBe(0)
  })

  it('reuses one worker across calls and terminates it on demand', async () => {
    installWorker()
    const { filterInWorker, terminate } = useFilterWorker()

    const first = filterInWorker(items, EMPTY_FILTERS)
    FakeWorker.instances[0].emit('message', { data: items })
    await first

    const second = filterInWorker(items, EMPTY_FILTERS)
    FakeWorker.instances[0].emit('message', { data: items })
    await second

    expect(FakeWorker.instances).toHaveLength(1)

    terminate()
    expect(FakeWorker.instances[0].terminated).toBe(true)
  })
})
