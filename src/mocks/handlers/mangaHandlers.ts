import { http, HttpResponse } from 'msw'
import { mangaDetails } from '@/mocks/fixtures/mangaData'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { applyTagPatch, isInCollection, mediaState } from '@/mocks/state/mediaState'
import { isObject, toCamelCase, toSnakeCase } from '@/core/utils/caseConverter'

export const mangaHandlers = [
  http.get(`${API_PREFIX}/manga`, ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const url = new URL(request.url)
    const query = url.searchParams.get('query')?.toLowerCase() ?? ''
    const tag = url.searchParams.get('tag')
    const page = Number(url.searchParams.get('page')) || 1
    const size = Number(url.searchParams.get('size')) || 20

    const filtered = mediaState.manga.filter((manga) => {
      if (!isInCollection(manga)) return false
      const matchesQuery
        = manga.title.toLowerCase().includes(query)
          || (manga.titleRussian?.toLowerCase().includes(query) ?? false)
          || (manga.titleEnglish?.toLowerCase().includes(query) ?? false)
      return matchesQuery && (!tag || manga.myTags.includes(tag))
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
    const item = mediaState.manga.find((manga) => manga.id === id)
    if (!item) return new HttpResponse(null, { status: 404 })

    const detail = mangaDetails[id]
    return HttpResponse.json(toSnakeCase(detail ? { ...detail, ...item } : item))
  }),

  http.patch(`${API_PREFIX}/manga/:id/progress`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mediaState.manga.findIndex((manga) => manga.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mediaState.manga[index] = { ...mediaState.manga[index], ...toCamelCase(body) }
    return HttpResponse.json(toSnakeCase(mediaState.manga[index]))
  }),

  http.patch(`${API_PREFIX}/manga/:id/tags`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mediaState.manga.findIndex((manga) => manga.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    const payload = toCamelCase(body)
    const myTags = Array.isArray(payload.myTags) ? payload.myTags.map(String) : []
    mediaState.manga[index] = { ...mediaState.manga[index], myTags }
    return HttpResponse.json(toSnakeCase(mediaState.manga[index]))
  }),

  http.post(`${API_PREFIX}/manga/tags/bulk`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body) || !Array.isArray(body.ids)) {
      return new HttpResponse(null, { status: 400 })
    }

    const payload = toCamelCase(body)
    const patch = {
      add: Array.isArray(payload.add) ? payload.add.map(String) : undefined,
      remove: Array.isArray(payload.remove) ? payload.remove.map(String) : undefined,
      clear: payload.clear === true,
    }

    let updated = 0
    for (const rawId of body.ids) {
      const index = mediaState.manga.findIndex((manga) => manga.id === String(rawId))
      if (index === -1) continue

      mediaState.manga[index] = {
        ...mediaState.manga[index],
        myTags: applyTagPatch(mediaState.manga[index].myTags, patch),
      }
      updated += 1
    }

    return HttpResponse.json({ updated })
  }),
]
