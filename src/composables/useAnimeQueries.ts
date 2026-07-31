import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { apiClient } from '@/apis/http/client'
import type { IAnimeStatusUpdateDto } from '@/apis/dtos/animeDto'
import { validateAnimeSearchResultDto } from '@/apis/validators/animeValidators'
import { ANIME } from '@/core/constants/apiRoutes'
import type { MediaSource } from '@/core/utils/slugGenerator'
import { mediaAdapter } from '@/mocks/mediaAdapter'

const ALL_SOURCES: MediaSource[] = ['shikimori', 'aniliberty']

export const animeKeys = {
  all: ['anime'] as const,
  searches: () => [...animeKeys.all, 'search'] as const,
  search: (query: Ref<string> | string, sources: MediaSource[]) =>
    [...animeKeys.searches(), query, sources] as const,
  library: (sources: MediaSource[]) => [...animeKeys.all, 'library', sources] as const,
  details: () => [...animeKeys.all, 'detail'] as const,
  detail: (mediaId: Ref<string> | string) => [...animeKeys.details(), mediaId] as const,
}

export function useAnimeLibrary(sources: MediaSource[] = ALL_SOURCES) {
  return useQuery({
    queryKey: animeKeys.library(sources),
    queryFn: ({ signal }) => mediaAdapter.search({ query: '', sources }, signal),
  })
}

export function useAnimeSearch(query: Ref<string>, sources: MediaSource[] = ALL_SOURCES) {
  return useQuery({
    queryKey: animeKeys.search(query, sources),
    queryFn: ({ signal }) => mediaAdapter.search({ query: query.value, sources }, signal),
    enabled: computed(() => query.value.length > 0),
  })
}

export function useAnimeDetail(mediaId: Ref<string>) {
  return useQuery({
    queryKey: animeKeys.detail(mediaId),
    queryFn: ({ signal }) => mediaAdapter.getAnimeById(mediaId.value, signal),
    enabled: computed(() => mediaId.value.length > 0),
  })
}

export interface IAnimeStatusVariables {
  mediaId: string
  payload: IAnimeStatusUpdateDto
}

export interface IAnimeTagVariables {
  mediaId: string
  tagIds: string[]
}

export function useAnimeStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mediaId, payload }: IAnimeStatusVariables) => {
      const { data } = await apiClient.patch<unknown>(`${ANIME}/${mediaId}/status`, payload)
      return validateAnimeSearchResultDto(data)
    },
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: animeKeys.detail(mediaId) })
      await queryClient.invalidateQueries({ queryKey: animeKeys.all })
    },
  })
}

export function useAnimeTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mediaId, tagIds }: IAnimeTagVariables) => {
      const { data } = await apiClient.patch<unknown>(`${ANIME}/${mediaId}/tags`, { myTags: tagIds })
      return validateAnimeSearchResultDto(data)
    },
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: animeKeys.detail(mediaId) })
      await queryClient.invalidateQueries({ queryKey: animeKeys.searches() })
    },
  })
}
