<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { getModels, type IAiContext, type IAiRequestOptions } from '@/apis/aiApi'
import AiChat from '@/components/ai/AiChat.vue'
import AiParaphrase from '@/components/ai/AiParaphrase.vue'
import AiRecommendation from '@/components/ai/AiRecommendation.vue'
import { useAiUsage } from '@/composables/useAiUsage'
import { useAnimeLibrary } from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTagStore } from '@/stores/useTagStore'

type AiTab = 'paraphrase' | 'recommend' | 'chat'

const { translate } = useAppI18n()
const settingsStore = useSettingsStore()
const tagStore = useTagStore()
const usage = useAiUsage()

const isOpen = ref(false)
const activeTab = ref<AiTab>('chat')

const TABS = [
  { value: 'chat', icon: 'pi-comments', labelKey: 'ai.chatTab' },
  { value: 'paraphrase', icon: 'pi-pencil', labelKey: 'ai.paraphraseTab' },
  { value: 'recommend', icon: 'pi-sparkles', labelKey: 'ai.recommendTab' },
] as const

const modelsQuery = useQuery({
  queryKey: ['ai', 'models'],
  queryFn: ({ signal }) => getModels(signal),
  enabled: isOpen,
})

// The library query is already cached by HomeView; reusing it costs nothing.
const animeLibrary = useAnimeLibrary()

const activeModel = computed(() =>
  modelsQuery.data.value?.find((model) => model.id === settingsStore.settings.aiModelId),
)

const context = computed<IAiContext | undefined>(() => {
  if (!settingsStore.settings.aiShareContext) return undefined
  return {
    watchedTitles: (animeLibrary.data.value?.items ?? [])
      .filter((item) => item.status === 'completed' || item.status === 'watching')
      .map((item) => item.title)
      .slice(0, 50),
    tags: tagStore.tags.map((tag) => tag.name),
  }
})

const requestOptions = computed<IAiRequestOptions>(() => ({
  model: settingsStore.settings.aiModelId,
  temperature: settingsStore.settings.aiTemperature,
  deepThink: settingsStore.settings.aiDeepThink,
  context: context.value,
}))

const usageLabel = computed(() =>
  translate('ai.sessionUsage', {
    tokens: usage.totalTokens.value.toLocaleString('ru-RU'),
    cost: usage.totalCost.value.toFixed(4),
  }),
)

function onTemperatureInput(event: Event): void {
  settingsStore.update({ aiTemperature: Number((event.target as HTMLInputElement).value) })
}
</script>

<template>
  <button
    v-if="settingsStore.settings.isAiEnabled && !isOpen"
    type="button"
    class="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition-colors hover:bg-brand-700 md:bottom-6"
    :aria-label="translate('ai.open')"
    @click="isOpen = true"
  >
    <i class="pi pi-sparkles text-lg" />
  </button>

  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 flex flex-col bg-white md:inset-y-0 md:left-auto md:right-0 md:w-[26rem] md:border-l md:border-gray-200 md:shadow-2xl dark:bg-gray-900 md:dark:border-gray-800"
    role="dialog"
    :aria-label="translate('ai.open')"
  >
    <header class="flex items-center gap-2 border-b border-gray-200 p-3 dark:border-gray-800">
      <i class="pi pi-sparkles text-brand-600 dark:text-brand-300" />
      <h2 class="font-semibold text-gray-900 dark:text-gray-100">
        {{ translate('ai.open') }}
      </h2>
      <button
        type="button"
        class="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        :aria-label="translate('ai.close')"
        @click="isOpen = false"
      >
        <i class="pi pi-times" />
      </button>
    </header>

    <div class="flex flex-col gap-2 border-b border-gray-200 p-3 text-sm dark:border-gray-800">
      <div class="flex items-center gap-2">
        <label
          class="flex-1"
          for="ai-model"
        >
          <span class="sr-only">{{ translate('ai.model') }}</span>
          <select
            id="ai-model"
            :value="settingsStore.settings.aiModelId"
            class="w-full rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
            @change="settingsStore.update({ aiModelId: ($event.target as HTMLSelectElement).value })"
          >
            <option
              v-for="model in modelsQuery.data.value ?? []"
              :key="model.id"
              :value="model.id"
            >
              {{ model.name }}
            </option>
          </select>
        </label>

        <label class="flex shrink-0 items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            class="accent-brand-600"
            :checked="settingsStore.settings.aiDeepThink"
            @change="settingsStore.update({ aiDeepThink: ($event.target as HTMLInputElement).checked })"
          >
          {{ translate('ai.deepThink') }}
        </label>
      </div>

      <label class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
        <span class="shrink-0">{{ translate('ai.temperature') }}</span>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          class="flex-1 accent-brand-600"
          :value="settingsStore.settings.aiTemperature"
          @input="onTemperatureInput"
        >
        <span class="w-8 text-right tabular-nums">{{ settingsStore.settings.aiTemperature.toFixed(1) }}</span>
      </label>

      <label class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
        <input
          type="checkbox"
          class="accent-brand-600"
          :checked="settingsStore.settings.aiShareContext"
          @change="settingsStore.update({ aiShareContext: ($event.target as HTMLInputElement).checked })"
        >
        {{ translate('ai.shareContext') }}
      </label>
    </div>

    <nav
      class="flex gap-1 border-b border-gray-200 px-3 pt-2 dark:border-gray-800"
      role="tablist"
    >
      <button
        v-for="tab in TABS"
        :key="tab.value"
        type="button"
        role="tab"
        class="-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors"
        :class="activeTab === tab.value
          ? 'border-brand-600 text-brand-600 dark:text-brand-300'
          : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
        :aria-selected="activeTab === tab.value"
        @click="activeTab = tab.value"
      >
        <i :class="['pi', tab.icon, 'text-xs']" />
        {{ translate(tab.labelKey) }}
      </button>
    </nav>

    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      <AiChat
        v-if="activeTab === 'chat'"
        :options="requestOptions"
        :model="activeModel"
      />
      <AiParaphrase
        v-else-if="activeTab === 'paraphrase'"
        :options="requestOptions"
        :model="activeModel"
      />
      <AiRecommendation
        v-else
        :options="requestOptions"
        :model="activeModel"
      />
    </div>

    <footer class="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
      {{ usageLabel }}
    </footer>
  </div>
</template>
