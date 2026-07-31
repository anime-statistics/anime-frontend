import { watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useSearchStore } from '@/stores/useSearchStore'

export const DEFAULT_SEARCH_DELAY = 300

export function useDebouncedSearch(delay = DEFAULT_SEARCH_DELAY) {
  const store = useSearchStore()

  // The store owns aborting: each search() replaces the AbortController registered
  // under its key, so an in-flight request is cancelled by the next one.
  async function searchNow(): Promise<void> {
    await store.search()
  }

  const search = useDebounceFn(searchNow, delay)

  const stop = watch(
    () => store.rawQuery,
    (query) => {
      if (query.trim()) void search()
      else store.clearResults()
    },
  )

  return { search, searchNow, stop }
}
