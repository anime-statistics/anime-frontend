import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { chatResponse, type IAiRequestOptions, type IChatApiMessage } from '@/apis/aiApi'
import { useAiStream } from '@/composables/useAiStream'
import { estimateTokens, useAiUsage } from '@/composables/useAiUsage'
import type { IChatMessage, ILLmModel } from '@/types/ai'

// Module scope on purpose: the history survives closing the panel but not a
// page reload (the backend owns the durable copy).
const messages = ref<IChatMessage[]>([])
let nextMessageId = 0

function pushMessage(role: IChatMessage['role'], content: string): IChatMessage {
  const message: IChatMessage = {
    id: `chat-${++nextMessageId}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  }
  messages.value = [...messages.value, message]
  return message
}

function toApiMessages(): IChatApiMessage[] {
  return messages.value.map(({ role, content }) => ({ role, content }))
}

export function useAiChat(): {
  messages: Ref<IChatMessage[]>
  isBusy: ComputedRef<boolean>
  partialResponse: Ref<string>
  sendMessage: (text: string, options: IAiRequestOptions, model?: ILLmModel) => Promise<void>
  clearHistory: () => void
} {
  const stream = useAiStream()
  const usage = useAiUsage()
  const isSending = ref(false)

  const isBusy = computed(() => isSending.value || stream.isStreaming.value)

  async function sendMessage(
    text: string,
    options: IAiRequestOptions,
    model?: ILLmModel,
  ): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed || isBusy.value) return

    pushMessage('user', trimmed)
    isSending.value = true

    try {
      let reply: string
      try {
        reply = await stream.streamChat(toApiMessages(), options)
        usage.record(
          model,
          options.model,
          estimateTokens(toApiMessages().map((message) => message.content).join(' ')),
          estimateTokens(reply),
        )
      } catch {
        // Streaming transports are the first thing proxies break; the plain
        // endpoint returns exact usage, so fall back to it.
        const fallback = await chatResponse(toApiMessages(), options)
        reply = fallback.reply
        usage.record(model, options.model, fallback.usage.inputTokens, fallback.usage.outputTokens)
      }

      pushMessage('assistant', reply)
    } finally {
      isSending.value = false
      stream.partialResponse.value = ''
    }
  }

  function clearHistory(): void {
    messages.value = []
  }

  return {
    messages,
    isBusy,
    partialResponse: stream.partialResponse,
    sendMessage,
    clearHistory,
  }
}
