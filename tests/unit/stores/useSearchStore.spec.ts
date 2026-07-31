import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/apis/http/client'
import { handlers, resetMockState } from '@/mocks/handlers'
import { parseQueryFilters, resolveSources, useSearchStore } from '@/stores/useSearchStore'

const server = setupServer(...handlers)

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://localhost:3000/api/v1/'
  apiClient.defaults.adapter = 'fetch'
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  setActivePinia(createPinia())
  resetMockState()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('parseQueryFilters', () => {
  it('returns plain text when there are no filters', () => {
    expect(parseQueryFilters('naruto shippuden')).toEqual({
      text: 'naruto shippuden',
      include: {},
      exclude: {},
    })
  })

  it('splits key:value filters out of the free text', () => {
    const filters = parseQueryFilters('titan genre:action status:watching')

    expect(filters.text).toBe('titan')
    expect(filters.include.genre).toEqual(['action'])
    expect(filters.include.status).toEqual(['watching'])
  })

  it('keeps colons inside a value', () => {
    const filters = parseQueryFilters('anime:shiki_id:123')

    expect(filters.include.anime).toEqual(['shiki_id:123'])
    expect(filters.text).toBe('')
  })

  it('collects repeated keys into a list', () => {
    const filters = parseQueryFilters('genre:action genre:drama')

    expect(filters.include.genre).toEqual(['action', 'drama'])
  })

  it('deduplicates identical values', () => {
    expect(parseQueryFilters('genre:action genre:action').include.genre).toEqual(['action'])
  })

  it('treats a leading dash as exclusion', () => {
    const filters = parseQueryFilters('titan -genre:comedy')

    expect(filters.exclude.genre).toEqual(['comedy'])
    expect(filters.include.genre).toBeUndefined()
  })

  it('supports quoted multi-word values', () => {
    expect(parseQueryFilters('genre:"slice of life"').include.genre).toEqual(['slice of life'])
  })

  it('lowercases filter keys', () => {
    expect(parseQueryFilters('Genre:action').include.genre).toEqual(['action'])
  })

  it('ignores a filter with an empty value', () => {
    expect(parseQueryFilters('genre:').include).toEqual({})
  })
})

describe('resolveSources', () => {
  it('defaults to both sources', () => {
    expect(resolveSources(parseQueryFilters('naruto'))).toEqual(['shikimori', 'aniliberty'])
  })

  it('narrows to a requested source', () => {
    expect(resolveSources(parseQueryFilters('source:aniliberty'))).toEqual(['aniliberty'])
  })

  it('drops an excluded source', () => {
    expect(resolveSources(parseQueryFilters('-source:aniliberty'))).toEqual(['shikimori'])
  })

  it('falls back to both sources when the filter leaves nothing', () => {
    expect(resolveSources(parseQueryFilters('source:mal'))).toEqual(['shikimori', 'aniliberty'])
  })
})

describe('useSearchStore.search', () => {
  it('fetches deduplicated results through mediaAdapter', async () => {
    const store = useSearchStore()
    store.setQuery('steins')

    await store.search()

    expect(store.isSearching).toBe(false)
    expect(store.results).toHaveLength(1)
    expect(store.results[0].secondarySource).toBe('aniliberty')
    expect(store.total).toBe(1)
  })

  it('applies genre filters on top of the adapter response', async () => {
    const store = useSearchStore()
    store.setQuery('genre:thriller')

    await store.search()

    expect(store.results.length).toBeGreaterThan(0)
    expect(
      store.results.every((item) =>
        (item.genres ?? []).some((genre) => genre.toLowerCase() === 'thriller'),
      ),
    ).toBe(true)
  })

  it('applies excluded genres', async () => {
    const store = useSearchStore()
    store.setQuery('-genre:action')

    await store.search()

    expect(
      store.results.some((item) =>
        (item.genres ?? []).some((genre) => genre.toLowerCase() === 'action'),
      ),
    ).toBe(false)
  })

  it('filters by status', async () => {
    const store = useSearchStore()
    store.setQuery('status:planned')

    await store.search()

    expect(store.results.length).toBeGreaterThan(0)
    expect(store.results.every((item) => item.status === 'planned')).toBe(true)
  })

  it('restricts the query to a single source', async () => {
    const store = useSearchStore()
    store.setQuery('source:aniliberty')

    await store.search()

    expect(store.results.every((item) => item.source === 'aniliberty')).toBe(true)
  })

  it('resets query and results', async () => {
    const store = useSearchStore()
    store.setQuery('steins')
    await store.search()

    store.reset()

    expect(store.rawQuery).toBe('')
    expect(store.results).toEqual([])
    expect(store.hasQuery).toBe(false)
  })
})
