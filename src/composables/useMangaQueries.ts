import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { apiClient } from '@/apis/http/client'
import type { IMangaStatusUpdateDto } from '@/apis/dtos/mangaDto'
import { validateMangaSearchResultDto } from '@/apis/validators/mangaValidators'
import { MANGA } from '@/core/constants/apiRoutes'
import type { MediaSource } from '@/core/utils/slugGenerator'
import { mediaAdapter } from '@/mocks/mediaAdapter'

const ALL_SOURCES: MediaSource[] = ['shikimori', 'aniliberty']

export const mangaKeys = {
  all: ['manga'] as const,
  searches: () => [...mangaKeys.all, 'search'] as const,
  search: (query: Ref<string> | string, sources: MediaSource[]) =>
    [...mangaKeys.searches(), query, sources] as const,
  library: (sources: MediaSource[]) => [...mangaKeys.all, 'library', sources] as const,
  details: () => [...mangaKeys.all, 'detail'] as const,
  detail: (mediaId: Ref<string> | string) => [...mangaKeys.details(), mediaId] as const,
}

export function useMangaLibrary(sources: MediaSource[] = ALL_SOURCES) {
  return useQuery({
    queryKey: mangaKeys.library(sources),
    queryFn: ({ signal }) => mediaAdapter.searchManga({ query: '', sources }, signal),
  })
}

export function useMangaSearch(query: Ref<string>, sources: MediaSource[] = ALL_SOURCES) {
  return useQuery({
    queryKey: mangaKeys.search(query, sources),
    queryFn: ({ signal }) => mediaAdapter.searchManga({ query: query.value, sources }, signal),
    enabled: computed(() => query.value.length > 0),
  })
}

export function useMangaDetail(mediaId: Ref<string>) {
  return useQuery({
    queryKey: mangaKeys.detail(mediaId),
    queryFn: ({ signal }) => mediaAdapter.getMangaById(mediaId.value, signal),
    enabled: computed(() => mediaId.value.length > 0),
  })
}

export interface IMangaStatusVariables {
  mediaId: string
  payload: IMangaStatusUpdateDto
}

export function useMangaStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mediaId, payload }: IMangaStatusVariables) => {
      const { data } = await apiClient.patch<unknown>(`${MANGA}/${mediaId}/status`, payload)
      return validateMangaSearchResultDto(data)
    },
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: mangaKeys.detail(mediaId) })
      await queryClient.invalidateQueries({ queryKey: mangaKeys.searches() })
    },
  })
}
