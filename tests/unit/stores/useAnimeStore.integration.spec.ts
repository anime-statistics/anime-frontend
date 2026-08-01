import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/apis/http/client'
import {
  useAnimeDetail,
  useAnimeLibrary,
  useAnimeProgressMutation,
  useAnimeSearch,
  useAnimeTagMutation,
} from '@/composables/useAnimeQueries'
import { animeSearchResults } from '@/mocks/fixtures/animeData'
import { handlers, resetMockState } from '@/mocks/handlers'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { useAnimeStore } from '@/stores/useAnimeStore'
import { withQueryClient } from '../../helpers/withQueryClient'

// Anchored on generated fixture data rather than a hard-coded title. The
// library only returns the collection, so the anchor has to be a tagged row.
const ANCHOR = animeSearchResults.find(
  (item) => item.source === 'shikimori' && item.titleEnglish !== undefined && item.myTags.length > 0,
)!
const ANCHOR_ID = ANCHOR.id

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

describe('anime library over MSW', () => {
  it('loads the library and converts snake_case into camelCase', async () => {
    const { result, wrapper } = withQueryClient(() => useAnimeLibrary())

    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))

    const items = result.data.value?.items ?? []
    expect(items.length).toBeGreaterThan(0)

    const anchor = items.find((item) => item.id === ANCHOR_ID)
    expect(anchor).toBeDefined()
    expect(anchor?.episodesTotal).toBe(ANCHOR.episodesTotal)
    expect(anchor?.titleEnglish).toBe(ANCHOR.titleEnglish)
    expect(anchor).not.toHaveProperty('episodes_total')

    wrapper.unmount()
  })

  it('reports a validation error when the server returns an unexpected shape', async () => {
    server.use(
      http.get(`${API_PREFIX}/anime`, () =>
        HttpResponse.json({ items: [{ id: 42, title: null }], total: 1, page: 1, size: 20 })),
    )

    const { result, wrapper } = withQueryClient(() => useAnimeLibrary())

    await vi.waitFor(() => expect(result.isError.value).toBe(true))
    expect(result.error.value).toBeInstanceOf(Error)

    wrapper.unmount()
  })

  it('skips the search request until the query is non-empty', async () => {
    const query = ref('')
    const { result, wrapper } = withQueryClient(() => useAnimeSearch(query))

    expect(result.fetchStatus.value).toBe('idle')

    query.value = ANCHOR.title
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))
    expect(result.data.value?.items.length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('loads a single title by id', async () => {
    const mediaId = ref(ANCHOR_ID)
    const { result, wrapper } = withQueryClient(() => useAnimeDetail(mediaId))

    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))
    expect(result.data.value?.title).toBe(ANCHOR.title)

    wrapper.unmount()
  })
})

describe('anime mutations over MSW', () => {
  it('patches the progress and invalidates the cached detail', async () => {
    const mediaId = ref(ANCHOR_ID)
    const { result: detail, wrapper, queryClient } = withQueryClient(() => useAnimeDetail(mediaId))
    await vi.waitFor(() => expect(detail.isSuccess.value).toBe(true))

    const { result: mutation, wrapper: mutationWrapper } = withQueryClient(
      () => useAnimeProgressMutation(),
      queryClient,
    )

    const updated = await mutation.mutateAsync({
      mediaId: ANCHOR_ID,
      payload: { watchedEpisodes: 3 },
    })

    expect(updated.id).toBe(ANCHOR_ID)
    await vi.waitFor(() => expect(detail.data.value?.watchedEpisodes).toBe(3))

    mutationWrapper.unmount()
    wrapper.unmount()
  })

  it('drops the title out of the collection when its last tag goes', async () => {
    const { result: mutation, wrapper } = withQueryClient(() => useAnimeTagMutation())

    const updated = await mutation.mutateAsync({ mediaId: ANCHOR_ID, tagIds: [] })
    expect(updated.myTags).toEqual([])

    const { result: library, wrapper: libraryWrapper } = withQueryClient(() => useAnimeLibrary())
    await vi.waitFor(() => expect(library.isSuccess.value).toBe(true))
    expect(library.data.value?.items.some((item) => item.id === ANCHOR_ID)).toBe(false)

    libraryWrapper.unmount()
    wrapper.unmount()
  })

  // A 4xx is deliberate: axios-retry backs 5xx off for seconds before giving up.
  it('surfaces a server error to the caller', async () => {
    server.use(
      http.patch(`${API_PREFIX}/anime/:id/progress`, () => new HttpResponse(null, { status: 404 })),
    )
    const { result: mutation, wrapper } = withQueryClient(() => useAnimeProgressMutation())

    await expect(
      mutation.mutateAsync({ mediaId: ANCHOR_ID, payload: { score: 7 } }),
    ).rejects.toThrow()

    wrapper.unmount()
  })
})

describe('useAnimeStore against real ids', () => {
  it('selects everything the library returned', async () => {
    const { result, wrapper } = withQueryClient(() => useAnimeLibrary())
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))

    const store = useAnimeStore()
    const ids = (result.data.value?.items ?? []).map((item) => item.id)
    store.selectAll(ids)

    expect(store.selectedCount).toBe(ids.length)
    expect(store.isSelected(ANCHOR_ID)).toBe(true)

    wrapper.unmount()
  })
})
