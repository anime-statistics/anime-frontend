import { delay, http, HttpResponse } from 'msw'
import { isObject, toSnakeCase } from '@/core/utils/caseConverter'
import { animeSearchResults } from '@/mocks/fixtures/animeData'
import { API_PREFIX } from '@/mocks/handlers/apiPrefix'
import { checkRateLimit, rateLimitedResponse } from '@/mocks/handlers/rateLimit'
import type { ILLmModel } from '@/types/ai'

const FILLER_WORDS = new Set(['э', 'ээ', 'ну', 'типа', 'вот', 'um', 'uh', 'like'])

export const MOCK_MODELS: ILLmModel[] = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    providerId: 'anthropic',
    contextWindow: 200_000,
    supportsStreaming: true,
    inputPrice: 3e-6,
    outputPrice: 15e-6,
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    providerId: 'deepseek',
    contextWindow: 128_000,
    supportsStreaming: true,
    inputPrice: 0.55e-6,
    outputPrice: 2.19e-6,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    providerId: 'openai',
    contextWindow: 128_000,
    supportsStreaming: false,
    inputPrice: 2.5e-6,
    outputPrice: 10e-6,
  },
]

// Genres arrive from Shikimori in Russian, so the moods have to match that.
const MOOD_GENRES: Record<string, string[]> = {
  sad: ['Драма', 'Психологическое'],
  happy: ['Комедия', 'Приключения'],
  tense: ['Триллер', 'Экшен', 'Детектив'],
  romantic: ['Романтика'],
  any: [],
}

function usageFor(input: string, output: string): { inputTokens: number, outputTokens: number } {
  return {
    inputTokens: Math.max(1, Math.ceil(input.length / 4)),
    outputTokens: Math.max(1, Math.ceil(output.length / 4)),
  }
}

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

function applyStyle(text: string, style: string): string {
  const base = tidy(text)
  switch (style) {
    case 'formal':
      return `Обратите внимание: ${base.replace(/!/g, '.')}`
    case 'casual':
      return `Короче, ${base.charAt(0).toLowerCase()}${base.slice(1)}`
    case 'compress': {
      const words = base.split(' ')
      return words.slice(0, Math.max(3, Math.ceil(words.length / 2))).join(' ')
    }
    case 'academic':
      return `Согласно проведённому анализу, ${base.charAt(0).toLowerCase()}${base.slice(1)}`
    default:
      return base
  }
}

function chatReply(lastMessage: string): string {
  const suggestions = suggestTitles(lastMessage)
  if (suggestions.length > 0) {
    return [
      `По вашему запросу нашлось ${suggestions.length}:`,
      '',
      ...suggestions.map((title) => `- **${title}**`),
      '',
      'Могу рассказать подробнее о любом из них.',
    ].join('\n')
  }

  return [
    'Я ассистент трекера аниме. Могу:',
    '',
    '- порекомендовать аниме под настроение',
    '- перефразировать заметку',
    '- ответить на вопросы о вашей библиотеке',
  ].join('\n')
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

  http.get(`${API_PREFIX}/ai/models`, () => {
    if (!checkRateLimit()) return rateLimitedResponse()

    return HttpResponse.json(toSnakeCase({ items: MOCK_MODELS }))
  }),

  http.post(`${API_PREFIX}/ai/paraphrase`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body) || typeof body.text !== 'string' || typeof body.style !== 'string') {
      return new HttpResponse(null, { status: 400 })
    }

    const result = applyStyle(body.text, body.style)
    return HttpResponse.json(toSnakeCase({ result, usage: usageFor(body.text, result) }))
  }),

  http.post(`${API_PREFIX}/ai/recommendations`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body)) return new HttpResponse(null, { status: 400 })

    const mood = typeof body.mood === 'string' ? body.mood : 'any'
    const prompt = typeof body.prompt === 'string' ? body.prompt : ''
    const genres = MOOD_GENRES[mood] ?? []

    const items = animeSearchResults
      .filter((anime) => genres.length === 0 || anime.genres?.some((genre) => genres.includes(genre)))
      .slice(0, 5)
      .map((anime, index) => ({
        mediaId: anime.id,
        title: anime.title,
        reason: prompt
          ? `Совпадает с запросом «${prompt}» по жанрам: ${(anime.genres ?? []).join(', ')}.`
          : `Похоже на то, что вы уже смотрели: ${(anime.genres ?? []).join(', ')}.`,
        score: Math.round((0.95 - index * 0.07) * 100) / 100,
      }))

    return HttpResponse.json(
      toSnakeCase({ items, usage: usageFor(prompt + mood, JSON.stringify(items)) }),
    )
  }),

  http.post(`${API_PREFIX}/ai/chat`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body) || !Array.isArray(body.messages)) {
      return new HttpResponse(null, { status: 400 })
    }

    const last = body.messages.at(-1)
    const lastContent = isObject(last) && typeof last.content === 'string' ? last.content : ''
    const reply = chatReply(lastContent)

    return HttpResponse.json(toSnakeCase({ reply, usage: usageFor(lastContent, reply) }))
  }),

  http.post(`${API_PREFIX}/ai/chat/stream`, async ({ request }) => {
    if (!checkRateLimit()) return rateLimitedResponse()

    const body: unknown = await request.json()
    if (!isObject(body) || !Array.isArray(body.messages)) {
      return new HttpResponse(null, { status: 400 })
    }

    const last = body.messages.at(-1)
    const lastContent = isObject(last) && typeof last.content === 'string' ? last.content : ''
    const reply = chatReply(lastContent)
    const encoder = new TextEncoder()
    const chunks = reply.match(/.{1,12}/gs) ?? []

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Sequential delays are the point: the client renders chunk by chunk.
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk))
          // oxlint-disable-next-line no-await-in-loop
          await delay(20)
        }
        controller.close()
      },
    })

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }),
]
