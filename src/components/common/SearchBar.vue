<script setup lang="ts">
import { computed, ref } from 'vue'
import VoiceInput from '@/components/voice/VoiceInput.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import { useSearchHistory } from '@/composables/useSearchHistory'
import { ALL_SOURCES, FILTER_KEYS } from '@/core/utils/filterParser'
import { useSearchStore } from '@/stores/useSearchStore'

const { translate } = useAppI18n()
const store = useSearchStore()
const { searchNow } = useDebouncedSearch()
const history = useSearchHistory()

const isFocused = ref(false)

const SUGGESTION_VALUES: Record<string, readonly string[]> = {
  status: ['watching', 'planned', 'completed', 'on_hold', 'dropped', 'rewatching'],
  source: ALL_SOURCES,
  anime: ['shiki_id:', 'liberty_id:'],
  manga: ['shiki_id:', 'liberty_id:'],
}

const activeToken = computed(() => store.rawQuery.split(/\s+/).at(-1) ?? '')

const suggestions = computed<string[]>(() => {
  if (!isFocused.value) return []

  const token = activeToken.value.toLowerCase()
  if (!token) return []

  const colonIndex = token.indexOf(':')
  if (colonIndex === -1) {
    return FILTER_KEYS.filter((key) => key.startsWith(token) && key !== token).map(
      (key) => `${key}:`,
    )
  }

  const key = token.slice(0, colonIndex)
  const partial = token.slice(colonIndex + 1)
  return (SUGGESTION_VALUES[key] ?? [])
    .filter((value) => value.startsWith(partial) && value !== partial)
    .map((value) => `${key}:${value}`)
})

function applySuggestion(suggestion: string): void {
  const tokens = store.rawQuery.split(/\s+/)
  tokens[tokens.length - 1] = suggestion
  store.setQuery(tokens.join(' '))
}

function submit(): void {
  history.push(store.rawQuery)
  void searchNow()
}

function clearQuery(): void {
  store.reset()
}

// The debounced watcher on rawQuery kicks off the search on its own.
function onVoiceTranscript(text: string): void {
  store.setQuery([store.rawQuery.trim(), text].filter(Boolean).join(' '))
}
</script>

<template>
  <div class="relative">
    <form
      class="flex items-center gap-2"
      role="search"
      @submit.prevent="submit"
    >
      <div
        class="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-brand-500 dark:border-gray-700"
      >
        <i class="pi pi-search shrink-0 text-gray-400" />
        <input
          :value="store.rawQuery"
          type="search"
          class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          data-testid="search-input"
          :placeholder="translate('anime.search.placeholder')"
          :aria-label="translate('nav.search')"
          @input="store.setQuery(($event.target as HTMLInputElement).value)"
          @focus="isFocused = true"
          @blur="isFocused = false"
        >
        <button
          v-if="store.rawQuery"
          type="button"
          class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          :aria-label="translate('filters.clearQuery')"
          @click="clearQuery"
        >
          <i class="pi pi-times" />
        </button>
        <VoiceInput
          class="shrink-0"
          :continuous="false"
          @transcript="onVoiceTranscript"
        />
      </div>

      <button
        type="submit"
        class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
      >
        {{ translate('filters.submit') }}
      </button>
    </form>

    <ul
      v-if="suggestions.length"
      class="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      :aria-label="translate('filters.suggestions')"
    >
      <li
        v-for="suggestion in suggestions"
        :key="suggestion"
      >
        <button
          type="button"
          class="w-full px-3 py-2 text-left font-mono text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          @mousedown.prevent="applySuggestion(suggestion)"
        >
          {{ suggestion }}
        </button>
      </li>
    </ul>

    <div
      v-if="history.entries.value.length"
      class="mt-2 flex flex-wrap items-center gap-2"
    >
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ translate('filters.history') }}
      </span>
      <button
        v-for="entry in history.entries.value"
        :key="entry"
        type="button"
        class="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:border-brand-400 dark:border-gray-700 dark:text-gray-300"
        @click="store.setQuery(entry)"
      >
        {{ entry }}
      </button>
      <button
        type="button"
        class="text-xs text-gray-400 underline hover:text-gray-600 dark:hover:text-gray-200"
        @click="history.clear()"
      >
        {{ translate('filters.clearHistory') }}
      </button>
    </div>
  </div>
</template>
