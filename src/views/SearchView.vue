<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useUrlFilters } from '@/composables/useUrlFilters'
import { useSearchStore } from '@/stores/useSearchStore'

const { translate, translatePlural } = useAppI18n()
const store = useSearchStore()
const { filters: urlFilters, setFilters } = useUrlFilters()

const knownGenres = ref<string[]>([])

onMounted(() => {
  if (urlFilters.value.query && urlFilters.value.query !== store.rawQuery) {
    store.setQuery(urlFilters.value.query)
    void store.search()
  }
})

watch(
  () => store.rawQuery,
  (query) => {
    if (query !== urlFilters.value.query) setFilters({ query })
  },
)

const query = computed({
  get: () => store.rawQuery,
  set: (value: string) => store.setQuery(value),
})

watch(
  () => store.results,
  (results) => {
    const merged = new Set(knownGenres.value)
    for (const item of results) {
      for (const genre of item.genres ?? []) merged.add(genre)
    }
    knownGenres.value = [...merged].toSorted()
  },
)
</script>

<template>
  <section class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ translate('pages.searchTitle') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ translate('pages.searchHint') }}
      </p>
    </header>

    <SearchBar />

    <div class="grid gap-6 lg:grid-cols-[220px_1fr]">
      <FilterPanel
        v-model="query"
        :genres="knownGenres"
      />

      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <LoadingSpinner
            v-if="store.isSearching"
            size="sm"
          />
          <span v-else-if="store.hasQuery">
            {{ translatePlural('pagination.results', store.total) }}
          </span>
          <span v-else>{{ translate('anime.search.hint') }}</span>
        </div>

        <ErrorMessage
          v-if="store.errorMessage"
          :message="store.errorMessage"
          @close="store.errorMessage = null"
        />

        <p
          v-else-if="store.hasQuery && !store.isSearching && store.results.length === 0"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          {{ translate('anime.search.empty') }}
        </p>

        <ul
          v-else
          class="flex flex-col gap-2"
        >
          <li
            v-for="item in store.results"
            :key="item.id"
            class="rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand-400 dark:border-gray-700"
          >
            <RouterLink
              :to="{ name: 'anime-detail', params: { id: item.id } }"
              class="flex flex-col gap-1"
            >
              <span class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ item.title }}</span>
                <span
                  class="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-gray-800 dark:text-brand-300"
                >
                  {{ item.source }}
                </span>
                <span
                  v-if="item.secondarySource"
                  class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  {{ item.secondarySource }}
                </span>
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ translatePlural('anime.episodes', item.episodesTotal) }}
                · {{ translate(`anime.status.${item.status}`) }}
                <template v-if="item.score">· {{ item.score }}</template>
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
