import { http, HttpResponse, delay } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/apis/http/client'
import { toSnakeCase } from '@/core/utils/caseConverter'
import { animeSearchResults } from '@/mocks/fixtures/animeData'
import { handlers, resetMockState } from '@/mocks/handlers'
import { useSearchStore } from '@/stores/useSearchStore'

const server = setupServer(...handlers)

function slugOf(mediaId: string): string {
  return mediaId.split('-').slice(1).join('-')
}

// A title that exists on both sources, so the dedupe path has something to merge.
const twinSlugs = new Set(
  animeSearchResults.filter((item) => item.source === 'aniliberty').map((item) => slugOf(item.id)),
)
const PAIRED = animeSearchResults.find(
  (item) => item.source === 'shikimori' && twinSlugs.has(slugOf(item.id)),
)!

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

describe('useSearchStore.search', () => {
  it('fetches deduplicated results through mediaAdapter', async () => {
    const store = useSearchStore()
    store.setQuery(PAIRED.title)

    await store.search()

    expect(store.isSearching).toBe(false)
    const merged = store.results.find((item) => item.id === PAIRED.id)
    expect(merged?.secondarySource).toBe('aniliberty')
    expect(store.total).toBe(store.results.length)
  })

  it('applies genre filters on top of the adapter response', async () => {
    const store = useSearchStore()
    store.setQuery('genre:романтика')

    await store.search()

    expect(store.results.length).toBeGreaterThan(0)
    expect(
      store.results.every((item) =>
        (item.genres ?? []).some((genre) => genre.toLowerCase() === 'романтика'),
      ),
    ).toBe(true)
  })

  it('applies excluded genres', async () => {
    const store = useSearchStore()
    store.setQuery('-genre:романтика')

    await store.search()

    expect(
      store.results.some((item) =>
        (item.genres ?? []).some((genre) => genre.toLowerCase() === 'романтика'),
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

  it('retries 5xx responses and surfaces the failure', async () => {
    let attempts = 0
    server.use(
      http.get('*/api/v1/anime', () => {
        attempts += 1
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const store = useSearchStore()
    store.setQuery('source:shikimori steins')

    await store.search()

    expect(attempts).toBe(4)
    expect(store.results).toEqual([])
    expect(store.errorMessage).not.toBeNull()
    expect(store.isSearching).toBe(false)
  }, 30_000)

  it('still returns results when only one source fails', async () => {
    server.use(
      http.get('*/api/v1/anime', ({ request }) => {
        const source = new URL(request.url).searchParams.get('source')
        if (source === 'aniliberty') return new HttpResponse(null, { status: 503 })
        return HttpResponse.json({
          items: toSnakeCase(animeSearchResults.filter((anime) => anime.source === 'shikimori')),
          total: 1,
          page: 1,
          size: 20,
        })
      }),
    )
    const store = useSearchStore()
    store.setQuery('steins')

    await store.search()

    expect(store.results.length).toBeGreaterThan(0)
    expect(store.errorMessage).toBeNull()
  }, 30_000)

  it('does not let a slow earlier search overwrite a newer one', async () => {
    server.use(
      http.get('*/api/v1/anime', async ({ request }) => {
        const query = new URL(request.url).searchParams.get('query') ?? ''
        if (query === 'naruto') await delay(80)

        const items = animeSearchResults.filter((anime) =>
          anime.title.toLowerCase().includes(query),
        )
        return HttpResponse.json({ items: toSnakeCase(items), total: items.length, page: 1, size: 20 })
      }),
    )

    const store = useSearchStore()

    store.setQuery('naruto')
    const slow = store.search()

    store.setQuery('steins')
    const fast = store.search()

    await Promise.all([slow, fast])

    expect(store.results.every((item) => item.title.toLowerCase().includes('steins'))).toBe(true)
    expect(store.isSearching).toBe(false)
  })
})

describe('useSearchStore state helpers', () => {
  it('clears results but keeps the query', async () => {
    const store = useSearchStore()
    store.setQuery('steins')
    await store.search()

    store.clearResults()

    expect(store.rawQuery).toBe('steins')
    expect(store.results).toEqual([])
    expect(store.total).toBe(0)
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
