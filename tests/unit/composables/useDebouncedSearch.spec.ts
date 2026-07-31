import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/apis/http/client'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import { handlers, resetMockState } from '@/mocks/handlers'
import { useSearchStore } from '@/stores/useSearchStore'

const server = setupServer(...handlers)

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://localhost:3000/api/v1/'
  apiClient.defaults.adapter = 'fetch'
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  setActivePinia(createPinia())
  resetMockState()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('useDebouncedSearch', () => {
  it('coalesces rapid query changes into a single search', async () => {
    const store = useSearchStore()
    const searchSpy = vi.spyOn(store, 'search').mockResolvedValue()
    useDebouncedSearch(300)

    store.setQuery('s')
    await nextTick()
    store.setQuery('st')
    await nextTick()
    store.setQuery('steins')
    await nextTick()

    expect(searchSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(300)

    expect(searchSpy).toHaveBeenCalledTimes(1)
  })

  it('waits for the full delay before searching', async () => {
    const store = useSearchStore()
    const searchSpy = vi.spyOn(store, 'search').mockResolvedValue()
    useDebouncedSearch(300)

    store.setQuery('steins')
    await nextTick()
    await vi.advanceTimersByTimeAsync(299)
    expect(searchSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(searchSpy).toHaveBeenCalledTimes(1)
  })

  it('clears results instead of searching when the query is emptied', async () => {
    const store = useSearchStore()
    const searchSpy = vi.spyOn(store, 'search').mockResolvedValue()
    const clearSpy = vi.spyOn(store, 'clearResults')
    useDebouncedSearch(300)

    store.setQuery('   ')
    await nextTick()
    await vi.advanceTimersByTimeAsync(300)

    expect(clearSpy).toHaveBeenCalled()
    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('searchNow bypasses the debounce', async () => {
    const store = useSearchStore()
    const searchSpy = vi.spyOn(store, 'search').mockResolvedValue()
    const { searchNow } = useDebouncedSearch(300)

    await searchNow()

    expect(searchSpy).toHaveBeenCalledTimes(1)
  })

  it('stops watching once the scope is disposed', async () => {
    const store = useSearchStore()
    const searchSpy = vi.spyOn(store, 'search').mockResolvedValue()
    const scope = effectScope()
    scope.run(() => useDebouncedSearch(300))

    scope.stop()
    store.setQuery('steins')
    await nextTick()
    await vi.advanceTimersByTimeAsync(300)

    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('aborts the in-flight request when a newer search starts', async () => {
    vi.useRealTimers()
    const store = useSearchStore()
    const { searchNow } = useDebouncedSearch(0)

    store.setQuery('naruto')
    const first = searchNow()
    store.setQuery('steins')
    const second = searchNow()

    await Promise.all([first, second])

    expect(store.results.every((item) => item.title.toLowerCase().includes('steins'))).toBe(true)
  })
})
