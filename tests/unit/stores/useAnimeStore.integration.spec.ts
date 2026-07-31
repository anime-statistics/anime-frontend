import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/apis/http/client'
import {
  useAnimeDetail,
  useAnimeLibrary,
  useAnimeSearch,
  useAnimeStatusMutation,
  useAnimeTagMutation,
} from '@/composables/useAnimeQueries'
import { handlers, resetMockState } from '@/mocks/handlers'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { useAnimeStore } from '@/stores/useAnimeStore'
import { withQueryClient } from '../../helpers/withQueryClient'

const FMA_ID = 'shikimori_5114-fullmetal-alchemist-brotherhood'

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

    const fma = items.find((item) => item.id === FMA_ID)
    expect(fma).toBeDefined()
    expect(fma?.episodesTotal).toBe(64)
    expect(fma?.titleEnglish).toBe('Fullmetal Alchemist: Brotherhood')
    expect(fma).not.toHaveProperty('episodes_total')

    wrapper.unmount()
  })

  it('reports a validation error when the server returns an unexpected shape', async () => {
    server.use(
      http.get(`${API_PREFIX}/anime`, () =>
        HttpResponse.json({ items: [{ id: 42, title: null }], total: 1, page: 1, size: 20 })),
    )

    const { result, wrapper } = withQueryClient(() => useAnimeLibrary(['shikimori']))

    await vi.waitFor(() => expect(result.isError.value).toBe(true))
    expect(result.error.value).toBeInstanceOf(Error)

    wrapper.unmount()
  })

  it('skips the search request until the query is non-empty', async () => {
    const query = ref('')
    const { result, wrapper } = withQueryClient(() => useAnimeSearch(query))

    expect(result.fetchStatus.value).toBe('idle')

    query.value = 'Steins'
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))
    expect(result.data.value?.items.length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('loads a single title by id', async () => {
    const mediaId = ref(FMA_ID)
    const { result, wrapper } = withQueryClient(() => useAnimeDetail(mediaId))

    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))
    expect(result.data.value?.title).toBe('Fullmetal Alchemist: Brotherhood')

    wrapper.unmount()
  })
})

describe('anime mutations over MSW', () => {
  it('patches the status and invalidates the cached detail', async () => {
    const mediaId = ref(FMA_ID)
    const { result: detail, wrapper, queryClient } = withQueryClient(() => useAnimeDetail(mediaId))
    await vi.waitFor(() => expect(detail.isSuccess.value).toBe(true))

    const { result: mutation, wrapper: mutationWrapper } = withQueryClient(
      () => useAnimeStatusMutation(),
      queryClient,
    )

    const updated = await mutation.mutateAsync({
      mediaId: FMA_ID,
      payload: { status: 'rewatching' },
    })

    expect(updated.status).toBe('rewatching')
    await vi.waitFor(() => expect(detail.data.value?.status).toBe('rewatching'))

    mutationWrapper.unmount()
    wrapper.unmount()
  })

  it('patches the tag list', async () => {
    const { result: mutation, wrapper } = withQueryClient(() => useAnimeTagMutation())

    const updated = await mutation.mutateAsync({ mediaId: FMA_ID, tagIds: [] })

    expect(updated.myTags).toEqual([])
    wrapper.unmount()
  })

  // A 4xx is deliberate: axios-retry backs 5xx off for seconds before giving up.
  it('surfaces a server error to the caller', async () => {
    server.use(
      http.patch(`${API_PREFIX}/anime/:id/status`, () => new HttpResponse(null, { status: 404 })),
    )
    const { result: mutation, wrapper } = withQueryClient(() => useAnimeStatusMutation())

    await expect(
      mutation.mutateAsync({ mediaId: FMA_ID, payload: { status: 'dropped' } }),
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
    expect(store.isSelected(FMA_ID)).toBe(true)

    wrapper.unmount()
  })
})
