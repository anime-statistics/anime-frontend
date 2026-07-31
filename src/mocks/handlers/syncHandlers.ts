import { http, HttpResponse } from 'msw'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { isObject } from '@/core/utils/caseConverter'

export const syncHandlers = [
  http.post(`${API_PREFIX}/integrations/:service/check`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    const service = String(params.service)
    if (service !== 'shikimori' && service !== 'aniliberty') {
      return new HttpResponse(null, { status: 404 })
    }

    // "Connected" simply means some credential was supplied — good enough for mocks.
    const connected
      = isObject(body) && Object.values(body).some((value) => typeof value === 'string' && value.trim())

    return HttpResponse.json({ connected })
  }),

  http.get(`${API_PREFIX}/sync/pending`, () => {
    if (!checkRateLimit()) return rateLimitedResponse()

    return HttpResponse.json({ items: [], total: 0 })
  }),

  http.post(`${API_PREFIX}/sync/commit`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body) || !Array.isArray(body.changes)) {
      return new HttpResponse(null, { status: 400 })
    }

    return HttpResponse.json({ committed: body.changes.length })
  }),
]
