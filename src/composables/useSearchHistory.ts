import { ref, type Ref } from 'vue'

export const SEARCH_HISTORY_KEY = 'anime-statistics:search-history'
export const MAX_HISTORY_ENTRIES = 10

function readHistory(): string[] {
  const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
  if (!stored) return []

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    return []
  }
}

export function useSearchHistory(): {
  entries: Ref<string[]>
  push: (query: string) => void
  remove: (query: string) => void
  clear: () => void
} {
  const entries = ref<string[]>(readHistory())

  function persist(): void {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(entries.value))
  }

  function push(query: string): void {
    const trimmed = query.trim()
    if (!trimmed) return

    entries.value = [trimmed, ...entries.value.filter((entry) => entry !== trimmed)].slice(
      0,
      MAX_HISTORY_ENTRIES,
    )
    persist()
  }

  function remove(query: string): void {
    entries.value = entries.value.filter((entry) => entry !== query)
    persist()
  }

  function clear(): void {
    entries.value = []
    persist()
  }

  return { entries, push, remove, clear }
}
