<script setup lang="ts">
import { ref } from 'vue'
import { getRecommendations, type IAiRequestOptions } from '@/apis/aiApi'
import { useAiUsage } from '@/composables/useAiUsage'
import { useAppI18n } from '@/composables/useAppI18n'
import type { IAiRecommendation, ILLmModel } from '@/types/ai'

const props = defineProps<{ options: IAiRequestOptions, model?: ILLmModel }>()

const { translate } = useAppI18n()
const usage = useAiUsage()

const MOODS = [
  { value: 'any', labelKey: 'ai.moodAny' },
  { value: 'sad', labelKey: 'ai.moodSad' },
  { value: 'happy', labelKey: 'ai.moodHappy' },
  { value: 'tense', labelKey: 'ai.moodTense' },
  { value: 'romantic', labelKey: 'ai.moodRomantic' },
] as const

const prompt = ref('')
const mood = ref<string>('any')
const items = ref<IAiRecommendation[]>([])
const openReasonIds = ref<Set<string>>(new Set())
const isBusy = ref(false)
const hasError = ref(false)
const hasSearched = ref(false)

async function run(): Promise<void> {
  if (isBusy.value) return

  isBusy.value = true
  hasError.value = false

  try {
    const response = await getRecommendations(prompt.value, mood.value, props.options)
    usage.record(props.model, props.options.model, response.usage.inputTokens, response.usage.outputTokens)
    items.value = response.items
    openReasonIds.value = new Set()
    hasSearched.value = true
  } catch {
    hasError.value = true
  } finally {
    isBusy.value = false
  }
}

function toggleReason(mediaId: string): void {
  const next = new Set(openReasonIds.value)
  if (next.has(mediaId)) next.delete(mediaId)
  else next.add(mediaId)
  openReasonIds.value = next
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-gray-600 dark:text-gray-300">{{ translate('ai.promptPlaceholder') }}</span>
      <input
        v-model="prompt"
        type="text"
        class="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
        :placeholder="translate('ai.promptPlaceholder')"
        @keyup.enter="run"
      >
    </label>

    <div class="flex items-end gap-2">
      <label class="flex flex-1 flex-col gap-1 text-sm">
        <span class="text-gray-600 dark:text-gray-300">{{ translate('ai.mood') }}</span>
        <select
          v-model="mood"
          class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option
            v-for="option in MOODS"
            :key="option.value"
            :value="option.value"
          >
            {{ translate(option.labelKey) }}
          </option>
        </select>
      </label>

      <button
        type="button"
        class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        :disabled="isBusy"
        @click="run"
      >
        {{ isBusy ? translate('ai.thinking') : translate('ai.recommendAction') }}
      </button>
    </div>

    <div
      v-if="hasError"
      class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
    >
      <span>{{ translate('ai.unavailable') }}</span>
      <button
        type="button"
        class="underline underline-offset-2"
        @click="run"
      >
        {{ translate('ai.retry') }}
      </button>
    </div>

    <p
      v-else-if="hasSearched && items.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('anime.search.empty') }}
    </p>

    <ul class="flex flex-col gap-2">
      <li
        v-for="item in items"
        :key="item.mediaId"
        class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
      >
        <div class="flex items-center justify-between gap-2">
          <RouterLink
            :to="{ name: 'anime-detail', params: { id: item.mediaId } }"
            class="min-w-0 truncate text-sm font-medium text-gray-900 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-300"
          >
            {{ item.title }}
          </RouterLink>
          <span class="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-gray-800 dark:text-brand-300">
            {{ translate('ai.match', { percent: Math.round(item.score * 100) }) }}
          </span>
        </div>

        <button
          type="button"
          class="mt-1 text-xs text-gray-500 underline underline-offset-2 dark:text-gray-400"
          :aria-expanded="openReasonIds.has(item.mediaId)"
          @click="toggleReason(item.mediaId)"
        >
          {{ translate('ai.whyButton') }}
        </button>
        <p
          v-if="openReasonIds.has(item.mediaId)"
          class="mt-1 text-xs text-gray-600 dark:text-gray-300"
        >
          {{ item.reason }}
        </p>
      </li>
    </ul>
  </section>
</template>
