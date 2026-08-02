import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { IAiRequestOptions } from '@/apis/aiApi'
import { apiClient } from '@/apis/http/client'
import { useAiChat } from '@/composables/useAiChat'
import { useAiUsage } from '@/composables/useAiUsage'
import { handlers, resetMockState } from '@/mocks/handlers'

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
  useAiChat().clearHistory()
  useAiUsage().reset()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

// happy-dom's fetch does not stream MSW ReadableStream bodies, so the stream
// call fails and the composable is expected to fall back to the plain endpoint.
describe('useAiChat', () => {
  it('appends the user message and the assistant reply', async () => {
    const chat = useAiChat()

    await chat.sendMessage('посоветуй что-то вроде Frieren', options)

    expect(chat.messages.value).toHaveLength(2)
    expect(chat.messages.value[0].role).toBe('user')
    expect(chat.messages.value[1].role).toBe('assistant')
    expect(chat.messages.value[1].content).toContain('Frieren')
    expect(chat.isBusy.value).toBe(false)
  })

  it('records token usage for the exchange', async () => {
    const chat = useAiChat()
    const usage = useAiUsage()

    await chat.sendMessage('привет', options)

    expect(usage.totalTokens.value).toBeGreaterThan(0)
  })

  it('ignores blank input', async () => {
    const chat = useAiChat()

    await chat.sendMessage('   ', options)

    expect(chat.messages.value).toHaveLength(0)
  })

  it('shares history across composable instances until cleared', async () => {
    const first = useAiChat()
    await first.sendMessage('привет', options)

    const second = useAiChat()
    expect(second.messages.value).toHaveLength(2)

    second.clearHistory()
    expect(first.messages.value).toHaveLength(0)
  })

  it('turns a failure of both transports into an assistant reply', async () => {
    server.use(
      http.post('*/api/v1/ai/chat/stream', () => new HttpResponse(null, { status: 503 })),
      http.post(
        '*/api/v1/ai/chat',
        () => HttpResponse.json(
          { message: 'AI-ассистент не подключён в этой версии бэкенда' },
          { status: 404 },
        ),
      ),
    )
    const chat = useAiChat()

    await chat.sendMessage('привет', options)

    expect(chat.messages.value).toHaveLength(2)
    expect(chat.messages.value[1].role).toBe('assistant')
    expect(chat.messages.value[1].content).toBe('AI-ассистент не подключён в этой версии бэкенда')
    expect(chat.isBusy.value).toBe(false)
  })
})
