import { ref, type Ref } from 'vue'

export const SYNC_HISTORY_KEY = 'anime-statistics:sync-history'
export const MAX_SYNC_HISTORY = 20

export interface ISyncHistoryEntry {
  at: string
  status: 'ok' | 'error'
  changes: number
}

function readHistory(): ISyncHistoryEntry[] {
  const stored = localStorage.getItem(SYNC_HISTORY_KEY)
  if (!stored) return []

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is ISyncHistoryEntry =>
        typeof entry === 'object'
        && entry !== null
        && typeof (entry as ISyncHistoryEntry).at === 'string'
        && ((entry as ISyncHistoryEntry).status === 'ok'
          || (entry as ISyncHistoryEntry).status === 'error')
        && typeof (entry as ISyncHistoryEntry).changes === 'number',
    )
  } catch {
    return []
  }
}

export function useSyncHistory(): {
  entries: Ref<ISyncHistoryEntry[]>
  record: (status: ISyncHistoryEntry['status'], changes: number) => void
  clear: () => void
} {
  const entries = ref<ISyncHistoryEntry[]>(readHistory())

  function persist(): void {
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(entries.value))
  }

  function record(status: ISyncHistoryEntry['status'], changes: number): void {
    entries.value = [
      { at: new Date().toISOString(), status, changes },
      ...entries.value,
    ].slice(0, MAX_SYNC_HISTORY)
    persist()
  }

  function clear(): void {
    entries.value = []
    persist()
  }

  return { entries, record, clear }
}
