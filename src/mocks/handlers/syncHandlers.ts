import { http, HttpResponse } from 'msw'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { isObject } from '@/core/utils/caseConverter'

export const syncHandlers = [
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
