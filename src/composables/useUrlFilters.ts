import { computed, type ComputedRef } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { ALL_SOURCES } from '@/core/utils/filterParser'
import type { MediaSource } from '@/core/utils/slugGenerator'

export interface IUrlFilters {
  query: string
  page: number
  size: number
  status: string
  genre: string
  year?: number
  tag: string
  sources: MediaSource[]
}

export interface IUrlFiltersOptions {
  defaultSize?: number
}

function firstValue(value: unknown): string {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

export function useUrlFilters(options: IUrlFiltersOptions = {}): {
  filters: ComputedRef<IUrlFilters>
  setFilters: (partial: Partial<IUrlFilters>) => void
} {
  const route = useRoute()
  const router = useRouter()
  const defaultSize = options.defaultSize ?? 20

  function positiveInt(value: unknown, fallback: number): number {
    const parsed = Number(firstValue(value))
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }

  const filters = computed<IUrlFilters>(() => {
    const year = Number(firstValue(route.query.year))
    const rawSources = firstValue(route.query.source)
    const sources = rawSources
      ? ALL_SOURCES.filter((source) => rawSources.split(',').includes(source))
      : [...ALL_SOURCES]

    return {
      query: firstValue(route.query.q),
      page: positiveInt(route.query.page, 1),
      size: positiveInt(route.query.size, defaultSize),
      status: firstValue(route.query.status),
      genre: firstValue(route.query.genre),
      year: Number.isInteger(year) && year > 0 ? year : undefined,
      tag: firstValue(route.query.tag),
      sources: sources.length ? sources : [...ALL_SOURCES],
    }
  })

  function setFilters(partial: Partial<IUrlFilters>): void {
    const next: LocationQueryRaw = { ...route.query }

    const assign = (key: string, value: string | number | undefined): void => {
      if (value === undefined || value === '' || value === 0) delete next[key]
      else next[key] = String(value)
    }

    if ('query' in partial) assign('q', partial.query)
    if ('page' in partial) assign('page', partial.page === 1 ? undefined : partial.page)
    if ('size' in partial) assign('size', partial.size === defaultSize ? undefined : partial.size)
    if ('status' in partial) assign('status', partial.status)
    if ('genre' in partial) assign('genre', partial.genre)
    if ('year' in partial) assign('year', partial.year)
    if ('tag' in partial) assign('tag', partial.tag)
    if ('sources' in partial) {
      const sources = partial.sources ?? []
      assign(
        'source',
        sources.length && sources.length !== ALL_SOURCES.length ? sources.join(',') : undefined,
      )
    }

    void router.replace({ query: next })
  }

  return { filters, setFilters }
}
