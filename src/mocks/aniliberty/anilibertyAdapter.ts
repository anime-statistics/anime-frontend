import { apiClient } from '@/apis/http/client'
import type { IAnimeDetailDto, IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import type { IMangaDetailDto, IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import {
  validateAnimeDetailDto,
  validateAnimeSearchResultDtoArray,
} from '@/apis/validators/animeValidators'
import {
  validateMangaDetailDto,
  validateMangaSearchResultDtoArray,
} from '@/apis/validators/mangaValidators'
import { ANIME, MANGA } from '@/core/constants/apiRoutes'
import { isObject } from '@/core/utils/caseConverter'
import type { IPaginatedResult } from '@/mocks/shikimori/shikimoriAdapter'

const SOURCE = 'aniliberty'

export const anilibertyAdapter = {
  async searchAnime(
    query: string,
    signal?: AbortSignal,
  ): Promise<IPaginatedResult<IAnimeSearchResultDto>> {
    const { data } = await apiClient.get<unknown>(ANIME, {
      params: { query, source: SOURCE },
      signal,
    })
    if (!isObject(data)) throw new Error('Unexpected anime search response')

    return {
      items: validateAnimeSearchResultDtoArray(data.items),
      total: Number(data.total ?? 0),
    }
  },

  async getAnimeById(mediaId: string, signal?: AbortSignal): Promise<IAnimeDetailDto> {
    const { data } = await apiClient.get<unknown>(`${ANIME}/${mediaId}`, { signal })
    return validateAnimeDetailDto(data)
  },

  async searchManga(
    query: string,
    signal?: AbortSignal,
  ): Promise<IPaginatedResult<IMangaSearchResultDto>> {
    const { data } = await apiClient.get<unknown>(MANGA, {
      params: { query, source: SOURCE },
      signal,
    })
    if (!isObject(data)) throw new Error('Unexpected manga search response')

    return {
      items: validateMangaSearchResultDtoArray(data.items),
      total: Number(data.total ?? 0),
    }
  },

  async getMangaById(mediaId: string, signal?: AbortSignal): Promise<IMangaDetailDto> {
    const { data } = await apiClient.get<unknown>(`${MANGA}/${mediaId}`, { signal })
    return validateMangaDetailDto(data)
  },
}
