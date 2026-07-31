import { ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  WATCH_HISTORY_KEY,
  computeStats,
  useWatchHistory,
  type IWatchHistoryEntry,
} from '@/composables/useWatchHistory'

const NARUTO = 'shikimori_20-naruto'
const ONE_PIECE = 'shikimori_21-one-piece'

beforeEach(() => {
  localStorage.clear()
})

describe('computeStats', () => {
  const entries: IWatchHistoryEntry[] = [
    { mediaId: NARUTO, episodes: 3, minutes: 72, at: '2024-05-01T10:00:00.000Z' },
    { mediaId: NARUTO, episodes: 2, minutes: 48, at: '2024-05-01T20:00:00.000Z' },
    { mediaId: NARUTO, episodes: 5, minutes: 120, at: '2024-05-02T10:00:00.000Z' },
  ]

  it('sums the episodes', () => {
    expect(computeStats(entries).totalEpisodes).toBe(10)
  })

  it('converts minutes to hours with one decimal', () => {
    expect(computeStats(entries).totalHours).toBe(4)
  })

  it('averages per distinct calendar day, not per entry', () => {
    expect(computeStats(entries).averagePerDay).toBe(5)
  })

  it('returns zeroes for an empty history', () => {
    expect(computeStats([])).toEqual({ totalEpisodes: 0, totalHours: 0, averagePerDay: 0 })
  })
})

describe('useWatchHistory', () => {
  it('starts empty', () => {
    expect(useWatchHistory().entries.value).toEqual([])
  })

  it('records an entry and persists it', () => {
    const history = useWatchHistory()

    history.record({ mediaId: NARUTO, episodes: 2, minutes: 48 })

    expect(history.entries.value).toHaveLength(1)
    expect(useWatchHistory().entries.value).toHaveLength(1)
  })

  it('ignores a zero-episode record', () => {
    const history = useWatchHistory()

    history.record({ mediaId: NARUTO, episodes: 0, minutes: 0 })

    expect(history.entries.value).toEqual([])
  })

  it('scopes entries and stats to one media id', () => {
    const shared = useWatchHistory()
    shared.record({ mediaId: NARUTO, episodes: 2, minutes: 48 })
    shared.record({ mediaId: ONE_PIECE, episodes: 5, minutes: 120 })

    const scoped = useWatchHistory(ref(NARUTO))

    expect(scoped.entries.value).toHaveLength(1)
    expect(scoped.stats.value.totalEpisodes).toBe(2)
  })

  it('clears only the scoped media id', () => {
    const shared = useWatchHistory()
    shared.record({ mediaId: NARUTO, episodes: 2, minutes: 48 })
    shared.record({ mediaId: ONE_PIECE, episodes: 5, minutes: 120 })

    useWatchHistory(ref(NARUTO)).clear()

    expect(useWatchHistory().entries.value.map((entry) => entry.mediaId)).toEqual([ONE_PIECE])
  })

  it('recovers from a corrupted payload', () => {
    localStorage.setItem(WATCH_HISTORY_KEY, 'not json')

    expect(useWatchHistory().entries.value).toEqual([])
  })

  it('drops malformed entries', () => {
    localStorage.setItem(
      WATCH_HISTORY_KEY,
      JSON.stringify([{ mediaId: NARUTO, episodes: 1, minutes: 24, at: '2024-05-01' }, { junk: true }]),
    )

    expect(useWatchHistory().entries.value).toHaveLength(1)
  })
})
