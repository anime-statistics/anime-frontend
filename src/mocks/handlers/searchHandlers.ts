import { http, HttpResponse } from 'msw'
import { MEDIA_SOURCES } from '@/apis/dtos/animeDto'
import { toSnakeCase } from '@/core/utils/caseConverter'
import type { MediaSource } from '@/core/utils/slugGenerator'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { deduplicateResults } from '@/mocks/search/mergeResults'
import { mediaState } from '@/mocks/state/mediaState'

interface ISearchableRecord {
  title: string
  titleRussian?: string
  titleJapanese?: string
  titleEnglish?: string
  source: MediaSource
}

function parseSources(raw: string | null): MediaSource[] {
  if (!raw) return [...MEDIA_SOURCES]
  const requested = new Set(raw.split(',').map((value) => value.trim()))
  const resolved = MEDIA_SOURCES.filter((source) => requested.has(source))
  return resolved.length ? resolved : [...MEDIA_SOURCES]
}

function matches(item: ISearchableRecord, query: string): boolean {
  if (!query) return true
  return [item.title, item.titleRussian, item.titleJapanese, item.titleEnglish].some(
    (title) => title?.toLowerCase().includes(query),
  )
}

// One request in, one merged list out. The client no longer knows that there is
// more than one upstream source.
export const searchHandlers = [
  http.get(`${API_PREFIX}/search`, ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const url = new URL(request.url)
    const query = url.searchParams.get('query')?.trim().toLowerCase() ?? ''
    const sources = parseSources(url.searchParams.get('sources'))
    const isManga = url.searchParams.get('type') === 'manga'

    if (isManga) {
      const items = mediaState.manga.filter(
        (item) => sources.includes(item.source) && matches(item, query),
      )
      return HttpResponse.json({ items: toSnakeCase(items), total: items.length })
    }

    const found = mediaState.anime.filter(
      (item) => sources.includes(item.source) && matches(item, query),
    )
    const merged = deduplicateResults(found)

    return HttpResponse.json({ items: toSnakeCase(merged), total: merged.length })
  }),
]
