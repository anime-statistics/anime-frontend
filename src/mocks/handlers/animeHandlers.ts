import { http, HttpResponse } from 'msw'
import { animeDetails } from '@/mocks/fixtures/animeData'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { applyTagPatch, isInCollection, mediaState } from '@/mocks/state/mediaState'
import { isObject, toCamelCase, toSnakeCase } from '@/core/utils/caseConverter'

export const animeHandlers = [
  // The library is the collection, not the catalogue: only titles the user has
  // tagged show up here. Everything else is reachable through /search.
  http.get(`${API_PREFIX}/anime`, ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const url = new URL(request.url)
    const query = url.searchParams.get('query')?.toLowerCase() ?? ''
    const tag = url.searchParams.get('tag')
    const page = Number(url.searchParams.get('page')) || 1
    const size = Number(url.searchParams.get('size')) || 20

    const filtered = mediaState.anime.filter((anime) => {
      if (!isInCollection(anime)) return false
      const matchesQuery
        = anime.title.toLowerCase().includes(query)
          || (anime.titleRussian?.toLowerCase().includes(query) ?? false)
          || (anime.titleEnglish?.toLowerCase().includes(query) ?? false)
      return matchesQuery && (!tag || anime.myTags.includes(tag))
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
    const item = mediaState.anime.find((anime) => anime.id === id)
    if (!item) return new HttpResponse(null, { status: 404 })

    // The mutable record wins so PATCHed fields show up here; the static detail
    // fixture only contributes the extra detail-only fields.
    const detail = animeDetails[id]
    return HttpResponse.json(toSnakeCase(detail ? { ...detail, ...item } : item))
  }),

  http.patch(`${API_PREFIX}/anime/:id/progress`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mediaState.anime.findIndex((anime) => anime.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mediaState.anime[index] = { ...mediaState.anime[index], ...toCamelCase(body) }
    return HttpResponse.json(toSnakeCase(mediaState.anime[index]))
  }),

  http.patch(`${API_PREFIX}/anime/:id/tags`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mediaState.anime.findIndex((anime) => anime.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    const payload = toCamelCase(body)
    const myTags = Array.isArray(payload.myTags) ? payload.myTags.map(String) : []
    mediaState.anime[index] = { ...mediaState.anime[index], myTags }
    return HttpResponse.json(toSnakeCase(mediaState.anime[index]))
  }),

  // Bulk tagging drives the tag page: strip a tag off a selection, move a
  // selection to another tag, or clear the tags to drop titles out of the
  // collection entirely.
  http.post(`${API_PREFIX}/anime/tags/bulk`, async ({ request }) => {
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
      const index = mediaState.anime.findIndex((anime) => anime.id === String(rawId))
      if (index === -1) continue

      mediaState.anime[index] = {
        ...mediaState.anime[index],
        myTags: applyTagPatch(mediaState.anime[index].myTags, patch),
      }
      updated += 1
    }

    return HttpResponse.json({ updated })
  }),
]
