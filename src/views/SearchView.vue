<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import FilterPanel from '@/components/common/FilterPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAnimeTagMutation } from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import { useToast } from '@/composables/useToast'
import { useUrlFilters } from '@/composables/useUrlFilters'
import { SEEDED_TAG_IDS } from '@/core/constants/seededTags'
import { primaryTitle, secondaryTitle } from '@/core/utils/mediaTitle'
import { useSearchStore } from '@/stores/useSearchStore'
import { useTagStore } from '@/stores/useTagStore'

const { translate, translatePlural, locale } = useAppI18n()
const store = useSearchStore()
const tagStore = useTagStore()
const toast = useToast()
const tagMutation = useAnimeTagMutation()
const { filters: urlFilters, setFilters } = useUrlFilters()

const knownGenres = ref<string[]>([])
const pendingId = ref<string | null>(null)

function displayTitle(item: IAnimeSearchResultDto): string {
  return primaryTitle(item, locale.value)
}

function altTitle(item: IAnimeSearchResultDto): string | undefined {
  return secondaryTitle(item, locale.value)
}

// Search shows the whole catalogue, so each row says whether it is already part
// of the collection and offers the one-click way in.
function isInCollection(item: IAnimeSearchResultDto): boolean {
  return item.myTags.length > 0
}

async function addToCollection(item: IAnimeSearchResultDto): Promise<void> {
  pendingId.value = item.id
  try {
    await tagMutation.mutateAsync({
      mediaId: item.id,
      tagIds: [SEEDED_TAG_IDS.planned],
    })
    // The results list is a snapshot of one request; patch it so the row flips
    // without a second round trip.
    item.myTags = [SEEDED_TAG_IDS.planned]
    toast.success(translate('collection.added', { title: displayTitle(item) }))
  } catch {
    toast.error(translate('collection.addFailed'))
  } finally {
    pendingId.value = null
  }
}

// The way back out: clearing the tags is what drops a title from the collection.
async function removeFromCollection(item: IAnimeSearchResultDto): Promise<void> {
  pendingId.value = item.id
  try {
    await tagMutation.mutateAsync({ mediaId: item.id, tagIds: [] })
    item.myTags = []
    toast.success(translate('collection.removed', { title: displayTitle(item) }))
  } catch {
    toast.error(translate('collection.removeFailed'))
  } finally {
    pendingId.value = null
  }
}

onMounted(() => {
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
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

    <SearchBar autofocus />

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

        <TransitionGroup
          v-else
          tag="ul"
          name="result-list"
          class="relative flex flex-col gap-2"
        >
          <li
            v-for="item in store.results"
            :key="item.id"
            class="flex items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand-400 dark:border-gray-700"
            data-testid="anime-card"
          >
            <RouterLink
              :to="{ name: 'anime-detail', params: { id: item.id } }"
              class="flex min-w-0 flex-1 flex-col gap-1"
            >
              <span class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ displayTitle(item) }}
                </span>
                <span
                  v-if="altTitle(item)"
                  class="text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ altTitle(item) }}
                </span>
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
                <template v-if="item.score">· {{ item.score }}</template>
              </span>
              <span
                v-if="isInCollection(item)"
                class="flex flex-wrap items-center gap-1"
              >
                <TagBadge
                  v-for="tag in tagStore.resolveTags(item.myTags)"
                  :key="tag.id"
                  :tag="tag"
                  size="sm"
                />
              </span>
            </RouterLink>

            <span
              v-if="isInCollection(item)"
              class="flex shrink-0 flex-col items-end gap-1 self-center"
            >
              <span class="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                <i class="pi pi-check mr-1" />{{ translate('collection.inCollection') }}
              </span>
              <button
                type="button"
                class="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-500 dark:hover:text-red-400"
                :disabled="pendingId === item.id"
                @click="removeFromCollection(item)"
              >
                <i class="pi pi-times mr-1" />{{ translate('collection.remove') }}
              </button>
            </span>
            <button
              v-else
              type="button"
              class="shrink-0 self-center whitespace-nowrap rounded-lg border border-brand-500 px-3 py-1.5 text-xs text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:text-brand-300 dark:hover:bg-gray-800"
              :disabled="pendingId === item.id"
              @click="addToCollection(item)"
            >
              <i class="pi pi-plus mr-1" />{{ translate('collection.add') }}
            </button>
          </li>
        </TransitionGroup>
      </div>
    </div>
  </section>
</template>
