import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { toApiRequestError } from '@/apis/http/errorHandler'
import { getAbortController, removeAbortController } from '@/apis/http/abortManager'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import { mediaApi } from '@/apis/mediaApi'
import { matchesFilters, parseQueryFilters, resolveSources } from '@/core/utils/filterParser'
import { useTagStore } from '@/stores/useTagStore'

const SEARCH_ABORT_KEY = 'search:anime'

export const useSearchStore = defineStore('search', () => {
  const tagStore = useTagStore()

  const rawQuery = ref('')
  const results = ref<IAnimeSearchResultDto[]>([])
  const total = ref(0)
  const isSearching = ref(false)
  const errorMessage = ref<string | null>(null)

  const filters = computed(() => parseQueryFilters(rawQuery.value))
  const sources = computed(() => resolveSources(filters.value))
  const hasQuery = computed(() => rawQuery.value.trim().length > 0)

  // Guards against a slow earlier search overwriting the results of a newer one.
  let latestRequestId = 0

  function setQuery(value: string): void {
    rawQuery.value = value
  }

  function clearResults(): void {
    results.value = []
    total.value = 0
    errorMessage.value = null
  }

  function reset(): void {
    rawQuery.value = ''
    clearResults()
  }

  async function search(): Promise<void> {
    const controller = getAbortController(SEARCH_ABORT_KEY)
    const requestId = ++latestRequestId
    isSearching.value = true
    errorMessage.value = null

    try {
      // A single request: the backend fans out to the sources and merges.
      const response = await mediaApi.searchAnime(
        { query: filters.value.text, sources: sources.value },
        controller.signal,
      )
      if (requestId !== latestRequestId) return

      const filtered = response.items.filter((item) =>
        matchesFilters(item, filters.value, tagStore.tagNamesById),
      )
      results.value = filtered
      total.value = filtered.length
    } catch (error) {
      const apiError = toApiRequestError(error)
      if (requestId === latestRequestId && apiError.code !== 0) {
        errorMessage.value = apiError.message
      }
    } finally {
      if (requestId === latestRequestId) {
        removeAbortController(SEARCH_ABORT_KEY)
        isSearching.value = false
      }
    }
  }

  return {
    rawQuery,
    results,
    total,
    isSearching,
    errorMessage,
    filters,
    sources,
    hasQuery,
    setQuery,
    clearResults,
    reset,
    search,
  }
})
