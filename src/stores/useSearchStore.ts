import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { toApiRequestError } from '@/apis/http/errorHandler'
import { getAbortController, removeAbortController } from '@/apis/http/abortManager'
import type { MediaSource } from '@/core/utils/slugGenerator'
import { mediaAdapter, type IMergedAnimeSearchResult } from '@/mocks/mediaAdapter'

export interface ISearchFilters {
  text: string
  include: Record<string, string[]>
  exclude: Record<string, string[]>
}

const ALL_SOURCES: MediaSource[] = ['shikimori', 'aniliberty']
const SEARCH_ABORT_KEY = 'search:anime'
const TOKEN_PATTERN = /(?:[^\s"]+|"[^"]*")+/g
const FILTER_PATTERN = /^([a-zA-Z][\w]*):(.*)$/

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

function matchesFilters(item: IMergedAnimeSearchResult, filters: ISearchFilters): boolean {
  const genres = new Set((item.genres ?? []).map((genre) => genre.toLowerCase()))

  const includedGenres = filters.include.genre ?? []
  const excludedGenres = filters.exclude.genre ?? []
  const includedStatuses = new Set(filters.include.status ?? [])
  const excludedStatuses = new Set(filters.exclude.status ?? [])

  if (includedGenres.some((genre) => !genres.has(genre.toLowerCase()))) return false
  if (excludedGenres.some((genre) => genres.has(genre.toLowerCase()))) return false
  if (includedStatuses.size && !includedStatuses.has(item.status)) return false
  if (excludedStatuses.has(item.status)) return false

  return true
}

export const useSearchStore = defineStore('search', () => {
  const rawQuery = ref('')
  const results = ref<IMergedAnimeSearchResult[]>([])
  const total = ref(0)
  const isSearching = ref(false)
  const errorMessage = ref<string | null>(null)

  const filters = computed(() => parseQueryFilters(rawQuery.value))
  const sources = computed(() => resolveSources(filters.value))
  const hasQuery = computed(() => rawQuery.value.trim().length > 0)

  function setQuery(value: string): void {
    rawQuery.value = value
  }

  function reset(): void {
    rawQuery.value = ''
    results.value = []
    total.value = 0
    errorMessage.value = null
  }

  async function search(): Promise<void> {
    const controller = getAbortController(SEARCH_ABORT_KEY)
    isSearching.value = true
    errorMessage.value = null

    try {
      const response = await mediaAdapter.search(
        { query: filters.value.text, sources: sources.value },
        controller.signal,
      )
      const filtered = response.items.filter((item) => matchesFilters(item, filters.value))
      results.value = filtered
      total.value = filtered.length
    } catch (error) {
      const apiError = toApiRequestError(error)
      if (apiError.code !== 0) errorMessage.value = apiError.message
    } finally {
      removeAbortController(SEARCH_ABORT_KEY)
      isSearching.value = false
    }
  }

  return {
    rawQuery,
    results,
    total,
    isSearching,
    errorMessage,
    filters,
    sources,
    hasQuery,
    setQuery,
    reset,
    search,
  }
})
