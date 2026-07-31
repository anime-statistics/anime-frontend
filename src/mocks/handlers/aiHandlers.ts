import { http, HttpResponse } from 'msw'
import { isObject, toSnakeCase } from '@/core/utils/caseConverter'
import { animeSearchResults } from '@/mocks/fixtures/animeData'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'

const FILLER_WORDS = new Set(['э', 'ээ', 'ну', 'типа', 'вот', 'um', 'uh', 'like'])

// Stands in for the LLM: drops filler words, tidies spacing and capitalises.
function tidy(text: string): string {
  const cleaned = text
    .split(/\s+/)
    .filter((word) => word && !FILLER_WORDS.has(word.toLowerCase().replace(/[.,!?]/g, '')))
    .join(' ')
    .replace(/\s+([.,!?])/g, '$1')
    .trim()

  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : ''
}

function suggestTitles(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 3)

  return animeSearchResults
    .filter((anime) =>
      words.some(
        (word) =>
          anime.title.toLowerCase().includes(word)
          || (anime.titleEnglish?.toLowerCase().includes(word) ?? false),
      ),
    )
    .slice(0, 5)
    .map((anime) => anime.title)
}

export const aiHandlers = [
  http.post(`${API_PREFIX}/ai/process-voice`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body) || typeof body.text !== 'string') {
      return new HttpResponse(null, { status: 400 })
    }

    return HttpResponse.json(
      toSnakeCase({
        processedText: tidy(body.text),
        suggestions: suggestTitles(body.text),
      }),
    )
  }),
]
