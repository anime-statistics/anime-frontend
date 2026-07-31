import { setupServer } from 'msw/node'
import { ref } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/apis/http/client'
import {
  useMangaDetail,
  useMangaLibrary,
  useMangaSearch,
  useMangaStatusMutation,
} from '@/composables/useMangaQueries'
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
} from '@/composables/useNoteQueries'
import { handlers, resetMockState } from '@/mocks/handlers'
import { withQueryClient } from '../../helpers/withQueryClient'

const MEDIA_ID = 'shikimori_5114-fullmetal-alchemist-brotherhood'

const server = setupServer(...handlers)

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://localhost:3000/api/v1/'
  apiClient.defaults.adapter = 'fetch'
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  resetMockState()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('manga queries', () => {
  it('loads the manga library', async () => {
    const { result, wrapper } = withQueryClient(() => useMangaLibrary())

    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))
    expect(result.data.value?.items.length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('stays idle until the search query is filled in', async () => {
    const query = ref('')
    const { result, wrapper } = withQueryClient(() => useMangaSearch(query))

    expect(result.fetchStatus.value).toBe('idle')

    query.value = 'Berserk'
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))

    wrapper.unmount()
  })

  it('loads a manga detail and patches its status', async () => {
    const { result: library, wrapper: libraryWrapper, queryClient } = withQueryClient(
      () => useMangaLibrary(),
    )
    await vi.waitFor(() => expect(library.isSuccess.value).toBe(true))

    const mediaId = ref(library.data.value?.items[0]?.id ?? '')
    const { result: detail, wrapper: detailWrapper } = withQueryClient(
      () => useMangaDetail(mediaId),
      queryClient,
    )
    await vi.waitFor(() => expect(detail.isSuccess.value).toBe(true))

    const { result: mutation, wrapper: mutationWrapper } = withQueryClient(
      () => useMangaStatusMutation(),
      queryClient,
    )
    const updated = await mutation.mutateAsync({
      mediaId: mediaId.value,
      payload: { status: 'reading' },
    })

    expect(updated.status).toBe('reading')

    mutationWrapper.unmount()
    detailWrapper.unmount()
    libraryWrapper.unmount()
  })
})

describe('note queries', () => {
  it('stays idle without a media id', () => {
    const { result, wrapper } = withQueryClient(() => useNotes(ref('')))

    expect(result.fetchStatus.value).toBe('idle')
    wrapper.unmount()
  })

  it('runs the full create, update and delete cycle', async () => {
    const mediaId = ref(MEDIA_ID)
    const { result: notes, wrapper: notesWrapper, queryClient } = withQueryClient(
      () => useNotes(mediaId),
    )
    await vi.waitFor(() => expect(notes.isSuccess.value).toBe(true))
    const initialCount = notes.data.value?.length ?? 0

    const { result: create, wrapper: createWrapper } = withQueryClient(
      () => useCreateNote(mediaId),
      queryClient,
    )
    const created = await create.mutateAsync({ mediaId: MEDIA_ID, content: '# Черновик' })
    expect(created.content).toBe('# Черновик')
    await vi.waitFor(() => expect(notes.data.value?.length).toBe(initialCount + 1))

    const { result: update, wrapper: updateWrapper } = withQueryClient(
      () => useUpdateNote(mediaId),
      queryClient,
    )
    const updated = await update.mutateAsync({ id: created.id, content: '# Готово' })
    expect(updated.content).toBe('# Готово')
    await vi.waitFor(() =>
      expect(notes.data.value?.find((note) => note.id === created.id)?.content).toBe('# Готово'))

    const { result: remove, wrapper: removeWrapper } = withQueryClient(
      () => useDeleteNote(mediaId),
      queryClient,
    )
    await remove.mutateAsync(created.id)
    await vi.waitFor(() => expect(notes.data.value?.length).toBe(initialCount))

    removeWrapper.unmount()
    updateWrapper.unmount()
    createWrapper.unmount()
    notesWrapper.unmount()
  })
})
