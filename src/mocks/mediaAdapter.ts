import Fuse from 'fuse.js'
import type { IAnimeDetailDto, IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import type { IMangaDetailDto, IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import { parseMediaId, type MediaSource } from '@/core/utils/slugGenerator'
import { anilibertyAdapter } from '@/mocks/aniliberty/anilibertyAdapter'
import { shikimoriAdapter, type IPaginatedResult } from '@/mocks/shikimori/shikimoriAdapter'

export interface IMergedAnimeSearchResult extends IAnimeSearchResultDto {
  secondarySource?: MediaSource
}

export interface ISearchParams {
  query: string
  sources: MediaSource[]
}

const SIMILARITY_THRESHOLD = 0.7

const SIMILARITY_WEIGHTS = {
  title: 0.5,
  titleEnglish: 0.2,
  year: 0.15,
  episodes: 0.15,
  genres: 0.15,
} as const

function normaliseTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function diceCoefficient(left: readonly string[], right: readonly string[]): number | null {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  if (leftSet.size === 0 || rightSet.size === 0) return null

  let shared = 0
  for (const token of leftSet) {
    if (rightSet.has(token)) shared += 1
  }
  return (2 * shared) / (leftSet.size + rightSet.size)
}

function titleSimilarity(left?: string, right?: string): number | null {
  if (!left || !right) return null
  return diceCoefficient(normaliseTitle(left), normaliseTitle(right))
}

function yearSimilarity(left?: string, right?: string): number | null {
  if (!left || !right) return null
  return left.slice(0, 4) === right.slice(0, 4) ? 1 : 0
}

function episodesSimilarity(left: number, right: number): number {
  return left === right ? 1 : 0
}

function genresSimilarity(left?: string[], right?: string[]): number | null {
  if (!left?.length || !right?.length) return null
  return diceCoefficient(
    left.map((genre) => genre.toLowerCase()),
    right.map((genre) => genre.toLowerCase()),
  )
}

export function computeSimilarity(
  left: IAnimeSearchResultDto,
  right: IAnimeSearchResultDto,
): number {
  const components: [number, number | null][] = [
    [SIMILARITY_WEIGHTS.title, titleSimilarity(left.title, right.title)],
    [SIMILARITY_WEIGHTS.titleEnglish, titleSimilarity(left.titleEnglish, right.titleEnglish)],
    [SIMILARITY_WEIGHTS.year, yearSimilarity(left.airedFrom, right.airedFrom)],
    [SIMILARITY_WEIGHTS.episodes, episodesSimilarity(left.episodesTotal, right.episodesTotal)],
    [SIMILARITY_WEIGHTS.genres, genresSimilarity(left.genres, right.genres)],
  ]

  let weightedScore = 0
  let usedWeight = 0

  for (const [weight, score] of components) {
    if (score === null) continue
    weightedScore += weight * score
    usedWeight += weight
  }

  return usedWeight === 0 ? 0 : weightedScore / usedWeight
}

function mergeDuplicates(
  left: IAnimeSearchResultDto,
  right: IAnimeSearchResultDto,
): IMergedAnimeSearchResult {
  const primary = right.source === 'shikimori' && left.source !== 'shikimori' ? right : left
  const secondary = primary === left ? right : left

  return {
    ...secondary,
    ...primary,
    secondarySource: secondary.source === primary.source ? undefined : secondary.source,
  }
}

export function deduplicateResults(
  items: IAnimeSearchResultDto[],
): IMergedAnimeSearchResult[] {
  const fuse = new Fuse(items, {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'titleEnglish', weight: 0.2 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
  })

  const merged: IMergedAnimeSearchResult[] = []
  const usedIndices = new Set<number>()

  for (let index = 0; index < items.length; index += 1) {
    if (usedIndices.has(index)) continue
    usedIndices.add(index)

    const current = items[index]
    const queries = [current.title, current.titleEnglish].filter(
      (value): value is string => Boolean(value),
    )
    const candidateIndices = new Set(
      queries
        .flatMap((query) => fuse.search(query))
        .map((result) => result.refIndex)
        .filter((refIndex) => refIndex !== index && !usedIndices.has(refIndex)),
    )

    let duplicateIndex: number | null = null
    let bestScore = SIMILARITY_THRESHOLD

    for (const candidateIndex of candidateIndices) {
      const score = computeSimilarity(current, items[candidateIndex])
      if (score > bestScore) {
        bestScore = score
        duplicateIndex = candidateIndex
      }
    }

    if (duplicateIndex === null) {
      merged.push(current)
      continue
    }

    usedIndices.add(duplicateIndex)
    merged.push(mergeDuplicates(current, items[duplicateIndex]))
  }

  return merged
}

// Partial failures degrade gracefully, but if every source failed the caller must
// see an error rather than an empty result set.
async function collectFulfilled<T>(
  promises: Promise<IPaginatedResult<T>>[],
): Promise<T[]> {
  if (promises.length === 0) return []

  const results = await Promise.allSettled(promises)
  const fulfilled = results.filter(
    (result): result is PromiseFulfilledResult<IPaginatedResult<T>> =>
      result.status === 'fulfilled',
  )

  if (fulfilled.length === 0) {
    const rejected = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
    throw rejected?.reason ?? new Error('All media sources failed')
  }

  return fulfilled.flatMap((result) => result.value.items)
}

export const mediaAdapter = {
  async search(
    params: ISearchParams,
    signal?: AbortSignal,
  ): Promise<IPaginatedResult<IMergedAnimeSearchResult>> {
    const promises: Promise<IPaginatedResult<IAnimeSearchResultDto>>[] = []
    if (params.sources.includes('shikimori')) {
      promises.push(shikimoriAdapter.searchAnime(params.query, signal))
    }
    if (params.sources.includes('aniliberty')) {
      promises.push(anilibertyAdapter.searchAnime(params.query, signal))
    }

    const deduped = deduplicateResults(await collectFulfilled(promises))
    return { items: deduped, total: deduped.length }
  },

  async searchManga(
    params: ISearchParams,
    signal?: AbortSignal,
  ): Promise<IPaginatedResult<IMangaSearchResultDto>> {
    const promises: Promise<IPaginatedResult<IMangaSearchResultDto>>[] = []
    if (params.sources.includes('shikimori')) {
      promises.push(shikimoriAdapter.searchManga(params.query, signal))
    }
    if (params.sources.includes('aniliberty')) {
      promises.push(anilibertyAdapter.searchManga(params.query, signal))
    }

    const items = await collectFulfilled(promises)
    return { items, total: items.length }
  },

  async getAnimeById(mediaId: string, signal?: AbortSignal): Promise<IAnimeDetailDto> {
    const parsed = parseMediaId(mediaId)
    if (!parsed) throw new Error(`Invalid mediaId: ${mediaId}`)

    return parsed.source === 'shikimori'
      ? shikimoriAdapter.getAnimeById(mediaId, signal)
      : anilibertyAdapter.getAnimeById(mediaId, signal)
  },

  async getMangaById(mediaId: string, signal?: AbortSignal): Promise<IMangaDetailDto> {
    const parsed = parseMediaId(mediaId)
    if (!parsed) throw new Error(`Invalid mediaId: ${mediaId}`)

    return parsed.source === 'shikimori'
      ? shikimoriAdapter.getMangaById(mediaId, signal)
      : anilibertyAdapter.getMangaById(mediaId, signal)
  },
}
