import type { MediaSource } from '@/core/utils/slugGenerator'

export interface ISearchFilters {
  text: string
  include: Record<string, string[]>
  exclude: Record<string, string[]>
}

export interface IMediaReference {
  source: MediaSource
  id: number
}

export interface IParsedFilters {
  animeId?: IMediaReference
  mangaId?: IMediaReference
  genre?: string
  year?: number
  status?: string
  tag?: string
  freeText: string
}

export interface IFilterableItem {
  status: string
  genres?: string[]
  airedFrom?: string
  myTags?: string[]
}

export const ALL_SOURCES: MediaSource[] = ['shikimori', 'aniliberty']

export const FILTER_KEYS = ['anime', 'manga', 'genre', 'year', 'status', 'tag', 'source'] as const

const MEDIA_STATUSES = [
  'watching',
  'completed',
  'planned',
  'on_hold',
  'dropped',
  'rewatching',
] as const

const TOKEN_PATTERN = /(?:[^\s"]+|"[^"]*")+/g
const FILTER_PATTERN = /^([a-zA-Z][\w]*):(.*)$/
const MEDIA_REFERENCE_PATTERN = /^(shiki_id|liberty_id):(\d+)$/i

function stripQuotes(value: string): string {
  return value.replace(/"/g, '').trim()
}

function addFilter(target: Record<string, string[]>, key: string, value: string): void {
  const normalisedKey = key.toLowerCase()
  const existing = target[normalisedKey] ?? []
  if (!existing.includes(value)) target[normalisedKey] = [...existing, value]
}

export function parseQueryFilters(rawQuery: string): ISearchFilters {
  const include: Record<string, string[]> = {}
  const exclude: Record<string, string[]> = {}
  const words: string[] = []

  for (const token of rawQuery.match(TOKEN_PATTERN) ?? []) {
    const isNegated = token.startsWith('-')
    const body = isNegated ? token.slice(1) : token
    const match = body.match(FILTER_PATTERN)

    if (!match) {
      const word = stripQuotes(body)
      if (word) words.push(word)
      continue
    }

    const value = stripQuotes(match[2])
    if (!value) continue
    addFilter(isNegated ? exclude : include, match[1], value)
  }

  return { text: words.join(' '), include, exclude }
}

export function resolveSources(filters: ISearchFilters): MediaSource[] {
  const requested = new Set(filters.include.source ?? [])
  const excluded = new Set(filters.exclude.source ?? [])
  const base = requested.size
    ? ALL_SOURCES.filter((source) => requested.has(source))
    : ALL_SOURCES

  const resolved = base.filter((source) => !excluded.has(source))
  return resolved.length ? resolved : ALL_SOURCES
}

export function matchesFilters(item: IFilterableItem, filters: ISearchFilters): boolean {
  const genres = new Set((item.genres ?? []).map((genre) => genre.toLowerCase()))
  const tags = new Set((item.myTags ?? []).map((tag) => tag.toLowerCase()))

  const includedGenres = filters.include.genre ?? []
  const excludedGenres = filters.exclude.genre ?? []
  const includedStatuses = new Set(filters.include.status ?? [])
  const excludedStatuses = new Set(filters.exclude.status ?? [])
  const includedTags = filters.include.tag ?? []
  const includedYears = filters.include.year ?? []

  if (includedGenres.some((genre) => !genres.has(genre.toLowerCase()))) return false
  if (excludedGenres.some((genre) => genres.has(genre.toLowerCase()))) return false
  if (includedStatuses.size && !includedStatuses.has(item.status)) return false
  if (excludedStatuses.has(item.status)) return false
  if (includedTags.some((tag) => !tags.has(tag.toLowerCase()))) return false
  if (includedYears.length && !includedYears.includes(item.airedFrom?.slice(0, 4) ?? '')) {
    return false
  }

  return true
}

function parseMediaReference(value: string | undefined): IMediaReference | undefined {
  const match = value?.match(MEDIA_REFERENCE_PATTERN)
  if (!match) return undefined

  return {
    source: match[1].toLowerCase() === 'shiki_id' ? 'shikimori' : 'aniliberty',
    id: Number(match[2]),
  }
}

export function parseSearchQuery(rawQuery: string): IParsedFilters {
  const { text, include } = parseQueryFilters(rawQuery)

  const year = Number(include.year?.[0])
  const status = include.status?.[0]?.toLowerCase()

  return {
    animeId: parseMediaReference(include.anime?.[0]),
    mangaId: parseMediaReference(include.manga?.[0]),
    genre: include.genre?.[0],
    year: Number.isInteger(year) && year > 0 ? year : undefined,
    status: MEDIA_STATUSES.some((known) => known === status) ? status : undefined,
    tag: include.tag?.[0],
    freeText: text,
  }
}

export function applyParsedFilters<T extends IFilterableItem>(
  items: T[],
  filters: IParsedFilters,
): T[] {
  let result = items

  if (filters.genre) {
    const genre = filters.genre.toLowerCase()
    result = result.filter((item) =>
      item.genres?.some((value) => value.toLowerCase().includes(genre)),
    )
  }
  if (filters.year) {
    const year = String(filters.year)
    result = result.filter((item) => item.airedFrom?.startsWith(year))
  }
  if (filters.status) {
    result = result.filter((item) => item.status === filters.status)
  }
  if (filters.tag) {
    const tag = filters.tag.toLowerCase()
    result = result.filter((item) =>
      item.myTags?.some((value) => value.toLowerCase() === tag),
    )
  }

  return result
}

export function hasFilter(rawQuery: string, key: string, value: string): boolean {
  return (parseQueryFilters(rawQuery).include[key.toLowerCase()] ?? []).includes(value)
}

export function withFilter(rawQuery: string, key: string, value: string): string {
  if (hasFilter(rawQuery, key, value)) return rawQuery
  const token = value.includes(' ') ? `${key}:"${value}"` : `${key}:${value}`
  return [rawQuery.trim(), token].filter(Boolean).join(' ')
}

export function withoutFilter(rawQuery: string, key: string, value?: string): string {
  const normalisedKey = key.toLowerCase()

  return (rawQuery.match(TOKEN_PATTERN) ?? [])
    .filter((token) => {
      const body = token.startsWith('-') ? token.slice(1) : token
      const match = body.match(FILTER_PATTERN)
      if (!match || match[1].toLowerCase() !== normalisedKey) return true
      return value !== undefined && stripQuotes(match[2]) !== value
    })
    .join(' ')
}
