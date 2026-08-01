import { http, HttpResponse } from 'msw'
import type { ITagDto } from '@/apis/dtos/tagDto'
import { tags } from '@/mocks/fixtures/tagData'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { isObject, toCamelCase, toSnakeCase } from '@/core/utils/caseConverter'

let mutableTags: ITagDto[] = [...tags]

export function resetTagState(): void {
  mutableTags = [...tags]
}

function nextTagId(): string {
  for (let counter = mutableTags.length + 1; ; counter += 1) {
    const id = `0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f6${counter.toString(16).padStart(2, '0')}`
    if (!mutableTags.some((tag) => tag.id === id)) return id
  }
}

export const tagHandlers = [
  http.get(`${API_PREFIX}/tags`, () => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const sorted = mutableTags.toSorted((a, b) => a.sortOrder - b.sortOrder)
    return HttpResponse.json({ items: toSnakeCase(sorted), total: sorted.length })
  }),

  http.post(`${API_PREFIX}/tags`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const payload = toCamelCase(body)
    const created: ITagDto = {
      id: nextTagId(),
      name: String(payload.name ?? ''),
      color: String(payload.color ?? '#6366f1'),
      icon: typeof payload.icon === 'string' ? payload.icon : undefined,
      isHidden: payload.isHidden === true,
      isSystem: false,
      sortOrder: Number(payload.sortOrder ?? mutableTags.length),
    }

    mutableTags = [...mutableTags, created]
    return HttpResponse.json(toSnakeCase(created), { status: 201 })
  }),

  http.patch(`${API_PREFIX}/tags/:id`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mutableTags.findIndex((tag) => tag.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    // isSystem is set at seed time and never by a client, so it is stripped from
    // the patch rather than trusted.
    const patch = toCamelCase(body)
    delete patch.isSystem

    mutableTags[index] = { ...mutableTags[index], ...patch }
    return HttpResponse.json(toSnakeCase(mutableTags[index]))
  }),

  http.delete(`${API_PREFIX}/tags/:id`, ({ params }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const id = String(params.id)
    const tag = mutableTags.find((candidate) => candidate.id === id)
    if (!tag) return new HttpResponse(null, { status: 404 })
    if (tag.isSystem) {
      return HttpResponse.json({ message: 'System tags cannot be deleted' }, { status: 409 })
    }

    mutableTags = mutableTags.filter((candidate) => candidate.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),
]
