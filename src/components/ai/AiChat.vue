<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { IAiRequestOptions } from '@/apis/aiApi'
import MarkdownPreview from '@/components/editor/MarkdownPreview.vue'
import { useAiChat } from '@/composables/useAiChat'
import { useAppI18n } from '@/composables/useAppI18n'
import type { ILLmModel } from '@/types/ai'

const props = defineProps<{ options: IAiRequestOptions, model?: ILLmModel }>()

const { translate } = useAppI18n()
const chat = useAiChat()

const draft = ref('')
const scroller = ref<HTMLElement | null>(null)

async function scrollToBottom(): Promise<void> {
  await nextTick()
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight })
}

watch(() => chat.messages.value.length, scrollToBottom)
watch(chat.partialResponse, scrollToBottom)

async function send(): Promise<void> {
  const text = draft.value
  draft.value = ''
  await chat.sendMessage(text, props.options, props.model)
}
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col gap-2">
    <div class="flex items-center justify-between">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ chat.messages.value.length === 0 ? translate('ai.emptyChat') : '' }}
      </p>
      <button
        v-if="chat.messages.value.length"
        type="button"
        class="text-xs text-gray-500 underline underline-offset-2 dark:text-gray-400"
        @click="chat.clearHistory"
      >
        {{ translate('ai.clearChat') }}
      </button>
    </div>

    <div
      ref="scroller"
      class="flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700"
    >
      <div
        v-for="message in chat.messages.value"
        :key="message.id"
        class="max-w-[85%] rounded-lg px-3 py-2 text-sm"
        :class="message.role === 'user'
          ? 'self-end bg-brand-600 text-white'
          : 'self-start bg-gray-100 dark:bg-gray-800'"
      >
        <template v-if="message.role === 'user'">
          {{ message.content }}
        </template>
        <MarkdownPreview
          v-else
          :content="message.content"
        />
      </div>

      <div
        v-if="chat.isBusy.value"
        class="max-w-[85%] self-start rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
      >
        <template v-if="chat.partialResponse.value">
          <pre class="whitespace-pre-wrap break-words font-sans">{{ chat.partialResponse.value }}</pre>
        </template>
        <span
          v-else
          class="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"
        >
          {{ translate('ai.thinking') }}
          <span class="inline-flex gap-0.5">
            <span class="size-1 animate-bounce rounded-full bg-current motion-reduce:animate-none" />
            <span class="size-1 animate-bounce rounded-full bg-current [animation-delay:120ms] motion-reduce:animate-none" />
            <span class="size-1 animate-bounce rounded-full bg-current [animation-delay:240ms] motion-reduce:animate-none" />
          </span>
        </span>
      </div>
    </div>

    <form
      class="flex items-center gap-2"
      @submit.prevent="send"
    >
      <input
        v-model="draft"
        type="text"
        class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
        :placeholder="translate('ai.chatPlaceholder')"
        :aria-label="translate('ai.chatPlaceholder')"
      >
      <button
        type="submit"
        class="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        :disabled="chat.isBusy.value || !draft.trim()"
        :aria-label="translate('ai.send')"
      >
        <i class="pi pi-send" />
      </button>
    </form>
  </section>
</template>
