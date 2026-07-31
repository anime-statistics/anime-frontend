import { computed, ref, type ComputedRef, type Ref } from 'vue'

export const WATCH_HISTORY_KEY = 'anime-statistics:watch-history'
export const DEFAULT_EPISODE_MINUTES = 24

export interface IWatchHistoryEntry {
  mediaId: string
  episodes: number
  minutes: number
  at: string
}

export interface IWatchHistoryStats {
  totalEpisodes: number
  totalHours: number
  averagePerDay: number
}

function readHistory(): IWatchHistoryEntry[] {
  const stored = localStorage.getItem(WATCH_HISTORY_KEY)
  if (!stored) return []

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is IWatchHistoryEntry =>
      typeof entry === 'object'
      && entry !== null
      && typeof (entry as IWatchHistoryEntry).mediaId === 'string'
      && typeof (entry as IWatchHistoryEntry).episodes === 'number'
      && typeof (entry as IWatchHistoryEntry).at === 'string',
    )
  } catch {
    return []
  }
}

export function computeStats(entries: readonly IWatchHistoryEntry[]): IWatchHistoryStats {
  const totalEpisodes = entries.reduce((sum, entry) => sum + entry.episodes, 0)
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0)
  const days = new Set(entries.map((entry) => entry.at.slice(0, 10))).size

  return {
    totalEpisodes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    averagePerDay: days === 0 ? 0 : Math.round((totalEpisodes / days) * 10) / 10,
  }
}

export function useWatchHistory(mediaId?: Ref<string>): {
  entries: ComputedRef<IWatchHistoryEntry[]>
  stats: ComputedRef<IWatchHistoryStats>
  record: (entry: Omit<IWatchHistoryEntry, 'at'> & { at?: string }) => void
  clear: () => void
} {
  const allEntries = ref<IWatchHistoryEntry[]>(readHistory())

  const entries = computed(() =>
    mediaId
      ? allEntries.value.filter((entry) => entry.mediaId === mediaId.value)
      : allEntries.value,
  )

  const stats = computed(() => computeStats(entries.value))

  function persist(): void {
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(allEntries.value))
  }

  function record(entry: Omit<IWatchHistoryEntry, 'at'> & { at?: string }): void {
    if (entry.episodes === 0) return

    allEntries.value = [
      ...allEntries.value,
      { ...entry, at: entry.at ?? new Date().toISOString() },
    ]
    persist()
  }

  function clear(): void {
    allEntries.value = mediaId
      ? allEntries.value.filter((entry) => entry.mediaId !== mediaId.value)
      : []
    persist()
  }

  return { entries, stats, record, clear }
}
