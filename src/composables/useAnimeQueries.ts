import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef, type Ref } from 'vue'
import type { IAnimeProgressUpdateDto } from '@/apis/dtos/animeDto'
import type { IExternalLinkDto } from '@/apis/dtos/externalLinkDto'
import type { IBulkTagUpdateDto } from '@/apis/dtos/tagDto'
import { mediaApi } from '@/apis/mediaApi'
import type { MediaSource } from '@/core/utils/slugGenerator'

export const animeKeys = {
  all: ['anime'] as const,
  searches: () => [...animeKeys.all, 'search'] as const,
  search: (query: MaybeRef<string>, sources?: MediaSource[]) =>
    [...animeKeys.searches(), query, sources ?? null] as const,
  library: (tag?: MaybeRef<string | null>) => [...animeKeys.all, 'library', tag ?? null] as const,
  details: () => [...animeKeys.all, 'detail'] as const,
  detail: (mediaId: MaybeRef<string>) => [...animeKeys.details(), mediaId] as const,
}

// The library is the collection: the backend only returns titles carrying at
// least one tag.
export function useAnimeLibrary(tag?: Ref<string | null>) {
  return useQuery({
    queryKey: animeKeys.library(tag),
    queryFn: ({ signal }) =>
      mediaApi.getAnimeLibrary({ tag: unref(tag) ?? undefined }, signal),
  })
}

export function useAnimeSearch(query: Ref<string>, sources?: MediaSource[]) {
  return useQuery({
    queryKey: animeKeys.search(query, sources),
    queryFn: ({ signal }) => mediaApi.searchAnime({ query: query.value, sources }, signal),
    enabled: computed(() => query.value.length > 0),
  })
}

export function useAnimeDetail(mediaId: Ref<string>) {
  return useQuery({
    queryKey: animeKeys.detail(mediaId),
    queryFn: ({ signal }) => mediaApi.getAnimeById(mediaId.value, signal),
    enabled: computed(() => mediaId.value.length > 0),
  })
}

export interface IAnimeProgressVariables {
  mediaId: string
  payload: IAnimeProgressUpdateDto
}

export interface IAnimeTagVariables {
  mediaId: string
  tagIds: string[]
}

export function useAnimeProgressMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mediaId, payload }: IAnimeProgressVariables) =>
      mediaApi.updateAnimeProgress(mediaId, payload),
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: animeKeys.detail(mediaId) })
      await queryClient.invalidateQueries({ queryKey: animeKeys.all })
    },
  })
}

// Tagging is also what adds a title to the collection and untagging is what
// removes it, so every list has to be refetched, not just the detail.
export function useAnimeTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mediaId, tagIds }: IAnimeTagVariables) =>
      mediaApi.updateAnimeTags(mediaId, tagIds),
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: animeKeys.detail(mediaId) })
      await queryClient.invalidateQueries({ queryKey: animeKeys.all })
    },
  })
}

export interface IAnimeLinksVariables {
  mediaId: string
  externalLinks: IExternalLinkDto[]
}

export function useAnimeLinksMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mediaId, externalLinks }: IAnimeLinksVariables) =>
      mediaApi.updateAnimeLinks(mediaId, externalLinks),
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: animeKeys.detail(mediaId) })
    },
  })
}

export function useAnimeBulkTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: IBulkTagUpdateDto) => mediaApi.bulkUpdateAnimeTags(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: animeKeys.all })
    },
  })
}
