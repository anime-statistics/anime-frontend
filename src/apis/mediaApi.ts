import { apiClient } from '@/apis/http/client'
import type {
  IAnimeDetailDto,
  IAnimeProgressUpdateDto,
  IAnimeSearchResultDto,
} from '@/apis/dtos/animeDto'
import type {
  IMangaDetailDto,
  IMangaProgressUpdateDto,
  IMangaSearchResultDto,
} from '@/apis/dtos/mangaDto'
import type { IBulkTagUpdateDto } from '@/apis/dtos/tagDto'
import {
  validateAnimeDetailDto,
  validateAnimeSearchResultDto,
  validateAnimeSearchResultDtoArray,
} from '@/apis/validators/animeValidators'
import {
  validateMangaDetailDto,
  validateMangaSearchResultDto,
  validateMangaSearchResultDtoArray,
} from '@/apis/validators/mangaValidators'
import { ANIME, MANGA, SEARCH } from '@/core/constants/apiRoutes'
import { isObject } from '@/core/utils/caseConverter'
import { parseMediaId, type MediaSource } from '@/core/utils/slugGenerator'

export interface IPaginatedResult<T> {
  items: T[]
  total: number
}

export interface ISearchParams {
  query: string
  sources?: MediaSource[]
}

export interface ILibraryParams {
  query?: string
  tag?: string
}

// The library is fetched whole because sorting, the kanban board and the client
// side pager all need the complete collection; the transport still pages so a
// collection larger than one response is not silently truncated.
const LIBRARY_PAGE_SIZE = 200

interface IListResponse {
  items: unknown
  total: unknown
}

function readListResponse(data: unknown): IListResponse {
  if (!isObject(data)) throw new Error('Unexpected list response')
  return { items: data.items, total: Number(data.total ?? 0) }
}

async function fetchLibraryPages<T>(
  path: string,
  params: ILibraryParams,
  validate: (value: unknown) => T[],
  signal?: AbortSignal,
): Promise<IPaginatedResult<T>> {
  async function fetchPage(page: number): Promise<IPaginatedResult<T>> {
    const { data } = await apiClient.get<unknown>(path, {
      params: { ...params, page, size: LIBRARY_PAGE_SIZE },
      signal,
    })
    const response = readListResponse(data)
    return { items: validate(response.items), total: Number(response.total) }
  }

  const first = await fetchPage(1)
  const pageCount = Math.ceil(first.total / LIBRARY_PAGE_SIZE)
  if (pageCount <= 1) return first

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_unused, index) => fetchPage(index + 2)),
  )

  return { items: [...first.items, ...rest.flatMap((page) => page.items)], total: first.total }
}

export const mediaApi = {
  // One request: the backend queries every source, merges the duplicates and
  // returns a single list.
  async searchAnime(
    params: ISearchParams,
    signal?: AbortSignal,
  ): Promise<IPaginatedResult<IAnimeSearchResultDto>> {
    const { data } = await apiClient.get<unknown>(SEARCH, {
      params: { query: params.query, sources: params.sources?.join(',') },
      signal,
    })
    const response = readListResponse(data)
    return {
      items: validateAnimeSearchResultDtoArray(response.items),
      total: Number(response.total),
    }
  },

  async searchManga(
    params: ISearchParams,
    signal?: AbortSignal,
  ): Promise<IPaginatedResult<IMangaSearchResultDto>> {
    const { data } = await apiClient.get<unknown>(SEARCH, {
      params: { query: params.query, sources: params.sources?.join(','), type: 'manga' },
      signal,
    })
    const response = readListResponse(data)
    return {
      items: validateMangaSearchResultDtoArray(response.items),
      total: Number(response.total),
    }
  },

  getAnimeLibrary(
    params: ILibraryParams = {},
    signal?: AbortSignal,
  ): Promise<IPaginatedResult<IAnimeSearchResultDto>> {
    return fetchLibraryPages(ANIME, params, validateAnimeSearchResultDtoArray, signal)
  },

  getMangaLibrary(
    params: ILibraryParams = {},
    signal?: AbortSignal,
  ): Promise<IPaginatedResult<IMangaSearchResultDto>> {
    return fetchLibraryPages(MANGA, params, validateMangaSearchResultDtoArray, signal)
  },

  async getAnimeById(mediaId: string, signal?: AbortSignal): Promise<IAnimeDetailDto> {
    if (!parseMediaId(mediaId)) throw new Error(`Invalid mediaId: ${mediaId}`)

    const { data } = await apiClient.get<unknown>(`${ANIME}/${mediaId}`, { signal })
    return validateAnimeDetailDto(data)
  },

  async getMangaById(mediaId: string, signal?: AbortSignal): Promise<IMangaDetailDto> {
    if (!parseMediaId(mediaId)) throw new Error(`Invalid mediaId: ${mediaId}`)

    const { data } = await apiClient.get<unknown>(`${MANGA}/${mediaId}`, { signal })
    return validateMangaDetailDto(data)
  },

  async updateAnimeProgress(
    mediaId: string,
    payload: IAnimeProgressUpdateDto,
  ): Promise<IAnimeSearchResultDto> {
    const { data } = await apiClient.patch<unknown>(`${ANIME}/${mediaId}/progress`, payload)
    return validateAnimeSearchResultDto(data)
  },

  async updateMangaProgress(
    mediaId: string,
    payload: IMangaProgressUpdateDto,
  ): Promise<IMangaSearchResultDto> {
    const { data } = await apiClient.patch<unknown>(`${MANGA}/${mediaId}/progress`, payload)
    return validateMangaSearchResultDto(data)
  },

  async updateAnimeTags(mediaId: string, myTags: string[]): Promise<IAnimeSearchResultDto> {
    const { data } = await apiClient.patch<unknown>(`${ANIME}/${mediaId}/tags`, { myTags })
    return validateAnimeSearchResultDto(data)
  },

  async updateMangaTags(mediaId: string, myTags: string[]): Promise<IMangaSearchResultDto> {
    const { data } = await apiClient.patch<unknown>(`${MANGA}/${mediaId}/tags`, { myTags })
    return validateMangaSearchResultDto(data)
  },

  async bulkUpdateAnimeTags(payload: IBulkTagUpdateDto): Promise<number> {
    const { data } = await apiClient.post<unknown>(`${ANIME}/tags/bulk`, payload)
    return isObject(data) ? Number(data.updated ?? 0) : 0
  },

  async bulkUpdateMangaTags(payload: IBulkTagUpdateDto): Promise<number> {
    const { data } = await apiClient.post<unknown>(`${MANGA}/tags/bulk`, payload)
    return isObject(data) ? Number(data.updated ?? 0) : 0
  },
}
