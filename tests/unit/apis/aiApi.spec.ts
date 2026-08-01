import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  chatResponse,
  getModels,
  getRecommendations,
  paraphrase,
  type IAiRequestOptions,
} from '@/apis/aiApi'
import { apiClient } from '@/apis/http/client'
import { computeCost, estimateTokens } from '@/composables/useAiUsage'
import { fillTemplate, DEFAULT_PROMPT_TEMPLATES } from '@/core/constants/promptTemplates'
import { handlers, resetMockState } from '@/mocks/handlers'
import { MOCK_MODELS } from '@/mocks/handlers/aiHandlers'

const server = setupServer(...handlers)

const options: IAiRequestOptions = {
  model: 'claude-sonnet-4-5',
  temperature: 0.7,
  deepThink: false,
}

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://localhost:3000/api/v1/'
  apiClient.defaults.adapter = 'fetch'
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  resetMockState()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('getModels', () => {
  it('returns the model list with prices', async () => {
    const models = await getModels()

    expect(models.map((model) => model.id)).toEqual(MOCK_MODELS.map((model) => model.id))
    expect(models[0].inputPrice).toBeGreaterThan(0)
  })
})

describe('paraphrase', () => {
  it('returns a restyled text and token usage', async () => {
    const response = await paraphrase('ну типа отличное аниме', 'formal', options)

    expect(response.result).toBe('Обратите внимание: Отличное аниме')
    expect(response.usage.inputTokens).toBeGreaterThan(0)
    expect(response.usage.outputTokens).toBeGreaterThan(0)
  })

  it('compresses the text to roughly half the words', async () => {
    const response = await paraphrase(
      'один два три четыре пять шесть семь восемь', 'compress', options,
    )

    expect(response.result.split(' ')).toHaveLength(4)
  })
})

describe('getRecommendations', () => {
  it('filters by mood genres and orders by score', async () => {
    const response = await getRecommendations('про космос', 'sad', options)

    expect(response.items.length).toBeGreaterThan(0)
    const scores = response.items.map((item) => item.score)
    expect(scores).toEqual(scores.toSorted((a, b) => b - a))
    expect(response.items.every((item) => item.reason.includes('про космос'))).toBe(true)
  })

  it('returns the top of the library for mood any', async () => {
    const response = await getRecommendations('', 'any', options)

    expect(response.items).toHaveLength(5)
  })
})

describe('chatResponse', () => {
  it('answers with matching titles as markdown', async () => {
    const response = await chatResponse(
      [{ role: 'user', content: 'посоветуй что-то вроде Frieren' }],
      options,
    )

    expect(response.reply).toContain('Frieren')
    expect(response.usage.outputTokens).toBeGreaterThan(0)
  })

  it('falls back to a help message when nothing matches', async () => {
    const response = await chatResponse([{ role: 'user', content: 'привет' }], options)

    expect(response.reply).toContain('ассистент')
  })
})

describe('usage helpers', () => {
  it('estimates tokens from character count', () => {
    expect(estimateTokens('abcd'.repeat(10))).toBe(10)
    expect(estimateTokens('')).toBe(1)
  })

  it('computes cost from per-token prices', () => {
    expect(computeCost(MOCK_MODELS[0], 1000, 500)).toBeCloseTo(
      1000 * 3e-6 + 500 * 15e-6,
      10,
    )
    expect(computeCost(undefined, 1000, 500)).toBe(0)
  })
})

describe('prompt templates', () => {
  it('substitutes named params', () => {
    expect(fillTemplate(DEFAULT_PROMPT_TEMPLATES.recommend_similar, { title: 'Berserk' })).toBe(
      'Найди аниме похожее на "Berserk". Объясни почему.',
    )
  })

  it('leaves unknown placeholders intact', () => {
    expect(fillTemplate('привет {name}', {})).toBe('привет {name}')
  })
})
