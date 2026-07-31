import { http, HttpResponse } from 'msw'
import type { INoteDto } from '@/apis/dtos/noteDto'
import { notes } from '@/mocks/fixtures/noteData'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import { isObject, toCamelCase, toSnakeCase } from '@/core/utils/caseConverter'

let mutableNotes: INoteDto[] = [...notes]

export function resetNoteState(): void {
  mutableNotes = [...notes]
}

function nextNoteId(): string {
  const suffix = (mutableNotes.length + 1).toString(16).padStart(2, '0')
  return `1a2b3c4d-5e6f-4a70-9b81-c2d3e4f5a6${suffix}`
}

export const noteHandlers = [
  http.get(`${API_PREFIX}/notes`, ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const mediaId = new URL(request.url).searchParams.get('media_id')
    const filtered = mediaId
      ? mutableNotes.filter((note) => note.mediaId === mediaId)
      : mutableNotes

    return HttpResponse.json({ items: toSnakeCase(filtered), total: filtered.length })
  }),

  http.post(`${API_PREFIX}/notes`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const payload = toCamelCase(body)
    const timestamp = new Date().toISOString()
    const created: INoteDto = {
      id: nextNoteId(),
      mediaId: String(payload.mediaId ?? ''),
      content: String(payload.content ?? ''),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    mutableNotes = [...mutableNotes, created]
    return HttpResponse.json(toSnakeCase(created), { status: 201 })
  }),

  http.patch(`${API_PREFIX}/notes/:id`, async ({ params, request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const index = mutableNotes.findIndex((note) => note.id === String(params.id))
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mutableNotes[index] = {
      ...mutableNotes[index],
      ...toCamelCase(body),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json(toSnakeCase(mutableNotes[index]))
  }),

  http.delete(`${API_PREFIX}/notes/:id`, ({ params }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const id = String(params.id)
    if (!mutableNotes.some((note) => note.id === id)) {
      return new HttpResponse(null, { status: 404 })
    }

    mutableNotes = mutableNotes.filter((note) => note.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),
]
