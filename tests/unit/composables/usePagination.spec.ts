import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useUrlFilters, type IUrlFilters } from '@/composables/useUrlFilters'

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
  })
}

async function mountUrlFilters(router: Router, defaultSize?: number): Promise<{
  filters: () => IUrlFilters
  setFilters: (partial: Partial<IUrlFilters>) => void
}> {
  let api: ReturnType<typeof useUrlFilters> | undefined

  const Host = defineComponent({
    setup() {
      api = useUrlFilters(defaultSize ? { defaultSize } : {})
      return () => h('div')
    },
  })

  // Only trigger the initial navigation when the caller has not routed yet,
  // otherwise this would wipe the query string the test just pushed.
  if (router.currentRoute.value.matched.length === 0) await router.push('/')
  mount(Host, { global: { plugins: [router] } })
  if (!api) throw new Error('composable not initialised')
  const ready = api

  return { filters: () => ready.filters.value, setFilters: ready.setFilters }
}

describe('useUrlFilters', () => {
  it('supplies defaults when the URL is empty', async () => {
    const { filters } = await mountUrlFilters(makeRouter())

    expect(filters()).toEqual({
      query: '',
      page: 1,
      size: 20,
      genre: '',
      year: undefined,
      tag: '',
      sources: ['shikimori', 'aniliberty'],
    })
  })

  it('reads every filter from the query string', async () => {
    const router = makeRouter()
    await router.push('/?q=titan&page=3&size=10&genre=action&year=2013&tag=t1&source=shikimori')
    const { filters } = await mountUrlFilters(router)

    expect(filters()).toEqual({
      query: 'titan',
      page: 3,
      size: 10,
      genre: 'action',
      year: 2013,
      tag: 't1',
      sources: ['shikimori'],
    })
  })

  it('ignores junk values', async () => {
    const router = makeRouter()
    await router.push('/?page=abc&size=-5&year=soon&source=mal')
    const { filters } = await mountUrlFilters(router)

    expect(filters().page).toBe(1)
    expect(filters().size).toBe(20)
    expect(filters().year).toBeUndefined()
    expect(filters().sources).toEqual(['shikimori', 'aniliberty'])
  })

  it('writes filters back to the URL and drops defaults', async () => {
    const router = makeRouter()
    const { setFilters } = await mountUrlFilters(router)

    setFilters({ query: 'titan', page: 2, size: 20, tag: 't1' })
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({ q: 'titan', page: '2', tag: 't1' }),
    )

    setFilters({ page: 1, query: '' })
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ tag: 't1' }))
  })

  it('respects a custom default size', async () => {
    const { filters } = await mountUrlFilters(makeRouter(), 50)

    expect(filters().size).toBe(50)
  })
})

describe('useInfiniteScroll', () => {
  const source = Array.from({ length: 45 }, (_, index) => index + 1)

  function fetchPage(page: number): Promise<{ items: number[], hasMore: boolean }> {
    const size = 20
    return Promise.resolve({
      items: source.slice((page - 1) * size, page * size),
      hasMore: page * size < source.length,
    })
  }

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('accumulates pages until the source is exhausted', async () => {
    const scroll = useInfiniteScroll(fetchPage)

    await scroll.loadMore()
    expect(scroll.items.value).toHaveLength(20)
    expect(scroll.hasMore.value).toBe(true)

    await scroll.loadMore()
    await scroll.loadMore()
    expect(scroll.items.value).toHaveLength(45)
    expect(scroll.hasMore.value).toBe(false)

    await scroll.loadMore()
    expect(scroll.items.value).toHaveLength(45)
  })

  it('does not double-load while a page is in flight', async () => {
    let resolveFetch: ((value: { items: number[], hasMore: boolean }) => void) | undefined
    const slowFetch = vi.fn(
      () =>
        new Promise<{ items: number[], hasMore: boolean }>((resolve) => {
          resolveFetch = resolve
        }),
    )
    const scroll = useInfiniteScroll(slowFetch)

    const first = scroll.loadMore()
    void scroll.loadMore()
    resolveFetch?.({ items: [1], hasMore: true })
    await first

    expect(slowFetch).toHaveBeenCalledTimes(1)
  })

  it('reset starts over from page one', async () => {
    const scroll = useInfiniteScroll(fetchPage)
    await scroll.loadMore()
    await scroll.loadMore()

    await scroll.reset()

    expect(scroll.items.value).toHaveLength(20)
    expect(scroll.page.value).toBe(1)
    expect(scroll.hasMore.value).toBe(true)
  })

  it('discards a stale in-flight page after reset', async () => {
    const resolvers: ((value: { items: number[], hasMore: boolean }) => void)[] = []
    const manualFetch = vi.fn(
      () =>
        new Promise<{ items: number[], hasMore: boolean }>((resolve) => {
          resolvers.push(resolve)
        }),
    )
    const scroll = useInfiniteScroll(manualFetch)

    const stale = scroll.loadMore()
    const fresh = scroll.reset()

    resolvers[0]?.({ items: [999], hasMore: true })
    await stale
    resolvers[1]?.({ items: [1], hasMore: true })
    await fresh

    expect(scroll.items.value).toEqual([1])
  })
})
