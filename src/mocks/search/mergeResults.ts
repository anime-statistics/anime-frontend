import Fuse, { type IFuseOptions } from 'fuse.js'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import type { MediaSource } from '@/core/utils/slugGenerator'

// Merging the same title coming from two sources is the backend's job: the
// client asks once and gets one card back. This module is the mock's stand-in
// for that server-side step.

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
): IAnimeSearchResultDto {
  const primary = right.source === 'shikimori' && left.source !== 'shikimori' ? right : left
  const secondary = primary === left ? right : left

  return {
    ...secondary,
    ...primary,
    // Collection membership belongs to whichever record carries the tags.
    myTags: primary.myTags.length ? primary.myTags : secondary.myTags,
    secondarySource: secondary.source === primary.source ? undefined : secondary.source,
  }
}

const FUSE_OPTIONS: IFuseOptions<IAnimeSearchResultDto> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'titleEnglish', weight: 0.2 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: true,
}

interface ISourceIndex {
  source: MediaSource
  indices: number[]
  fuse: Fuse<IAnimeSearchResultDto>
}

// One index per source. A duplicate is by definition the same title arriving
// from a different source, so searching only the other sources both matches the
// intent and keeps a full-catalogue query out of quadratic territory: without
// it every row is fuzzy-matched against every other one.
function indexBySource(items: IAnimeSearchResultDto[]): ISourceIndex[] {
  const grouped = new Map<MediaSource, number[]>()

  for (const [index, item] of items.entries()) {
    const bucket = grouped.get(item.source)
    if (bucket) bucket.push(index)
    else grouped.set(item.source, [index])
  }

  return [...grouped].map(([source, indices]) => ({
    source,
    indices,
    fuse: new Fuse(
      indices.map((index) => items[index]),
      FUSE_OPTIONS,
    ),
  }))
}

export function deduplicateResults(items: IAnimeSearchResultDto[]): IAnimeSearchResultDto[] {
  const sourceIndexes = indexBySource(items)
  const merged: IAnimeSearchResultDto[] = []
  const usedIndices = new Set<number>()

  for (let index = 0; index < items.length; index += 1) {
    if (usedIndices.has(index)) continue
    usedIndices.add(index)

    const current = items[index]
    const queries = [current.title, current.titleEnglish].filter(
      (value): value is string => Boolean(value),
    )

    let duplicateIndex: number | null = null
    let bestScore = SIMILARITY_THRESHOLD

    for (const candidate of sourceIndexes) {
      if (candidate.source === current.source) continue

      const candidateIndices = new Set(
        queries
          .flatMap((query) => candidate.fuse.search(query))
          .map((result) => candidate.indices[result.refIndex])
          .filter((refIndex) => !usedIndices.has(refIndex)),
      )

      for (const candidateIndex of candidateIndices) {
        const score = computeSimilarity(current, items[candidateIndex])
        if (score > bestScore) {
          bestScore = score
          duplicateIndex = candidateIndex
        }
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
