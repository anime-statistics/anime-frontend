import { ref, type Ref } from 'vue'
import { AI_TIMEOUT_MS, type IAiRequestOptions, type IChatApiMessage } from '@/apis/aiApi'
import { config } from '@/core/constants/config'
import { toSnakeCase } from '@/core/utils/caseConverter'

export function useAiStream(): {
  partialResponse: Ref<string>
  isStreaming: Ref<boolean>
  streamChat: (messages: IChatApiMessage[], options: IAiRequestOptions) => Promise<string>
} {
  const partialResponse = ref('')
  const isStreaming = ref(false)

  async function streamChat(
    messages: IChatApiMessage[],
    options: IAiRequestOptions,
  ): Promise<string> {
    isStreaming.value = true
    partialResponse.value = ''

    try {
      const base = new URL(config.apiBaseUrl, window.location.origin)
      const response = await fetch(new URL('ai/chat/stream', base), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase({ messages, ...options })),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed with status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      // Sequential by nature: each read() yields the next chunk of one stream.
      // oxlint-disable-next-line no-await-in-loop
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        partialResponse.value += decoder.decode(chunk.value, { stream: true })
      }

      return partialResponse.value
    } finally {
      isStreaming.value = false
    }
  }

  return { partialResponse, isStreaming, streamChat }
}
