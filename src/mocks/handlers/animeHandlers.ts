import { http, HttpResponse } from 'msw'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import { animeDetails, animeSearchResults } from '@/mocks/fixtures/animeData'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { isObject, toCamelCase, toSnakeCase } from '@/core/utils/caseConverter'

let mutableAnime: IAnimeSearchResultDto[] = [...animeSearchResults]

export function resetAnimeState(): void {
  mutableAnime = [...animeSearchResults]
}

export const animeHandlers = [
  http.get(`${API_PREFIX}/anime`, ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const url = new URL(request.url)
    const query = url.searchParams.get('query')?.toLowerCase() ?? ''
    const source = url.searchParams.get('source')
    const status = url.searchParams.get('status')
    const page = Number(url.searchParams.get('page')) || 1
    const size = Number(url.searchParams.get('size')) || 20

    const filtered = mutableAnime.filter((anime) => {
      const matchesQuery
        = anime.title.toLowerCase().includes(query)
          || (anime.titleEnglish?.toLowerCase().includes(query) ?? false)
      const matchesSource = !source || anime.source === source
      const matchesStatus = !status || anime.status === status
      return matchesQuery && matchesSource && matchesStatus
    })

    const start = (page - 1) * size
    const items = filtered.slice(start, start + size)

    return HttpResponse.json({
      items: toSnakeCase(items),
      total: filtered.length,
      page,
      size,
    })
  }),

  http.get(`${API_PREFIX}/anime/:id`, ({ params }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const id = String(params.id)
    const item = mutableAnime.find((anime) => anime.id === id)
    if (!item) return new HttpResponse(null, { status: 404 })

    // The mutable record wins so PATCHed fields show up here; the static detail
    // fixture only contributes the extra detail-only fields.
    const detail = animeDetails[id]
    return HttpResponse.json(toSnakeCase(detail ? { ...detail, ...item } : item))
  }),

  http.patch(`${API_PREFIX}/anime/:id/status`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mutableAnime.findIndex((anime) => anime.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mutableAnime[index] = { ...mutableAnime[index], ...toCamelCase(body) }
    return HttpResponse.json(toSnakeCase(mutableAnime[index]))
  }),

  http.patch(`${API_PREFIX}/anime/:id/tags`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mutableAnime.findIndex((anime) => anime.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mutableAnime[index] = { ...mutableAnime[index], ...toCamelCase(body) }
    return HttpResponse.json(toSnakeCase(mutableAnime[index]))
  }),

  http.post(`${API_PREFIX}/anime/bulk`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body) || !Array.isArray(body.ids)) {
      return new HttpResponse(null, { status: 400 })
    }

    const patch = isObject(body.patch) ? toCamelCase(body.patch) : {}
    let updated = 0

    for (const rawId of body.ids) {
      const index = mutableAnime.findIndex((anime) => anime.id === String(rawId))
      if (index !== -1) {
        mutableAnime[index] = { ...mutableAnime[index], ...patch }
        updated += 1
      }
    }

    return HttpResponse.json({ updated })
  }),
]
