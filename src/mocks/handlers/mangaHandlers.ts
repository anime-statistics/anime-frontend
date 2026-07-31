import { http, HttpResponse } from 'msw'
import type { IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import { mangaDetails, mangaSearchResults } from '@/mocks/fixtures/mangaData'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { isObject, toCamelCase, toSnakeCase } from '@/core/utils/caseConverter'

let mutableManga: IMangaSearchResultDto[] = [...mangaSearchResults]

export function resetMangaState(): void {
  mutableManga = [...mangaSearchResults]
}

export const mangaHandlers = [
  http.get(`${API_PREFIX}/manga`, ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const url = new URL(request.url)
    const query = url.searchParams.get('query')?.toLowerCase() ?? ''
    const source = url.searchParams.get('source')
    const status = url.searchParams.get('status')
    const page = Number(url.searchParams.get('page')) || 1
    const size = Number(url.searchParams.get('size')) || 20

    const filtered = mutableManga.filter((manga) => {
      const matchesQuery
        = manga.title.toLowerCase().includes(query)
          || (manga.titleEnglish?.toLowerCase().includes(query) ?? false)
      const matchesSource = !source || manga.source === source
      const matchesStatus = !status || manga.status === status
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

  http.get(`${API_PREFIX}/manga/:id`, ({ params }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const id = String(params.id)
    const item = mutableManga.find((manga) => manga.id === id)
    if (!item) return new HttpResponse(null, { status: 404 })

    const detail = mangaDetails[id]
    return HttpResponse.json(toSnakeCase(detail ? { ...detail, ...item } : item))
  }),

  http.patch(`${API_PREFIX}/manga/:id/status`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mutableManga.findIndex((manga) => manga.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mutableManga[index] = { ...mutableManga[index], ...toCamelCase(body) }
    return HttpResponse.json(toSnakeCase(mutableManga[index]))
  }),

  http.patch(`${API_PREFIX}/manga/:id/tags`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mutableManga.findIndex((manga) => manga.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mutableManga[index] = { ...mutableManga[index], ...toCamelCase(body) }
    return HttpResponse.json(toSnakeCase(mutableManga[index]))
  }),
]
