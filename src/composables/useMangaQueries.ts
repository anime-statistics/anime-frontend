import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef, type Ref } from 'vue'
import type { IExternalLinkDto } from '@/apis/dtos/externalLinkDto'
import type { IMangaProgressUpdateDto } from '@/apis/dtos/mangaDto'
import type { IBulkTagUpdateDto } from '@/apis/dtos/tagDto'
import { mediaApi } from '@/apis/mediaApi'
import type { MediaSource } from '@/core/utils/slugGenerator'

export const mangaKeys = {
  all: ['manga'] as const,
  searches: () => [...mangaKeys.all, 'search'] as const,
  search: (query: MaybeRef<string>, sources?: MediaSource[]) =>
    [...mangaKeys.searches(), query, sources ?? null] as const,
  library: (tag?: MaybeRef<string | null>) => [...mangaKeys.all, 'library', tag ?? null] as const,
  details: () => [...mangaKeys.all, 'detail'] as const,
  detail: (mediaId: MaybeRef<string>) => [...mangaKeys.details(), mediaId] as const,
}

export function useMangaLibrary(tag?: Ref<string | null>) {
  return useQuery({
    queryKey: mangaKeys.library(tag),
    queryFn: ({ signal }) =>
      mediaApi.getMangaLibrary({ tag: unref(tag) ?? undefined }, signal),
  })
}

export function useMangaSearch(query: Ref<string>, sources?: MediaSource[]) {
  return useQuery({
    queryKey: mangaKeys.search(query, sources),
    queryFn: ({ signal }) => mediaApi.searchManga({ query: query.value, sources }, signal),
    enabled: computed(() => query.value.length > 0),
  })
}

export function useMangaDetail(mediaId: Ref<string>) {
  return useQuery({
    queryKey: mangaKeys.detail(mediaId),
    queryFn: ({ signal }) => mediaApi.getMangaById(mediaId.value, signal),
    enabled: computed(() => mediaId.value.length > 0),
  })
}

export interface IMangaProgressVariables {
  mediaId: string
  payload: IMangaProgressUpdateDto
}

export interface IMangaTagVariables {
  mediaId: string
  tagIds: string[]
}

export function useMangaProgressMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mediaId, payload }: IMangaProgressVariables) =>
      mediaApi.updateMangaProgress(mediaId, payload),
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: mangaKeys.detail(mediaId) })
      await queryClient.invalidateQueries({ queryKey: mangaKeys.all })
    },
  })
}

export function useMangaTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mediaId, tagIds }: IMangaTagVariables) =>
      mediaApi.updateMangaTags(mediaId, tagIds),
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: mangaKeys.detail(mediaId) })
      await queryClient.invalidateQueries({ queryKey: mangaKeys.all })
    },
  })
}

export interface IMangaLinksVariables {
  mediaId: string
  externalLinks: IExternalLinkDto[]
}

export function useMangaLinksMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mediaId, externalLinks }: IMangaLinksVariables) =>
      mediaApi.updateMangaLinks(mediaId, externalLinks),
    onSuccess: async (_result, { mediaId }) => {
      await queryClient.invalidateQueries({ queryKey: mangaKeys.detail(mediaId) })
    },
  })
}

export function useMangaBulkTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: IBulkTagUpdateDto) => mediaApi.bulkUpdateMangaTags(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mangaKeys.all })
    },
  })
}
