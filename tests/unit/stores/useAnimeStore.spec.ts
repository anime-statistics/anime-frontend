import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAnimeStore } from '@/stores/useAnimeStore'
import { useMangaStore } from '@/stores/useMangaStore'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useAnimeStore selection', () => {
  it('starts with an empty selection', () => {
    const store = useAnimeStore()

    expect(store.selectedCount).toBe(0)
    expect(store.hasSelection).toBe(false)
  })

  it('toggles an id on and off', () => {
    const store = useAnimeStore()

    store.toggleSelection('shikimori_20-naruto')
    expect(store.isSelected('shikimori_20-naruto')).toBe(true)
    expect(store.selectedCount).toBe(1)

    store.toggleSelection('shikimori_20-naruto')
    expect(store.isSelected('shikimori_20-naruto')).toBe(false)
    expect(store.hasSelection).toBe(false)
  })

  it('replaces the selection with selectAll', () => {
    const store = useAnimeStore()
    store.toggleSelection('shikimori_20-naruto')

    store.selectAll(['shikimori_21-one-piece', 'aniliberty_311-frieren'])

    expect(store.selectedCount).toBe(2)
    expect(store.isSelected('shikimori_20-naruto')).toBe(false)
  })

  it('clears the selection', () => {
    const store = useAnimeStore()
    store.selectAll(['shikimori_21-one-piece'])

    store.clearSelection()

    expect(store.selectedCount).toBe(0)
  })
})

describe('useAnimeStore view mode', () => {
  it('defaults to cards and can switch to kanban', () => {
    const store = useAnimeStore()

    expect(store.viewMode).toBe('cards')

    store.setViewMode('kanban')
    expect(store.viewMode).toBe('kanban')
  })
})

describe('useAnimeStore extractNumericId', () => {
  it('reads the numeric id out of a slug media id', () => {
    const store = useAnimeStore()

    expect(store.extractNumericId('shikimori_5114-fullmetal-alchemist-brotherhood')).toBe(5114)
  })

  it('returns null for a malformed id', () => {
    const store = useAnimeStore()

    expect(store.extractNumericId('naruto')).toBeNull()
  })
})

describe('useMangaStore', () => {
  it('mirrors the anime store but keeps independent state', () => {
    const animeStore = useAnimeStore()
    const mangaStore = useMangaStore()

    animeStore.toggleSelection('shikimori_20-naruto')
    mangaStore.toggleSelection('shikimori_2-berserk')

    expect(animeStore.selectedCount).toBe(1)
    expect(mangaStore.isSelected('shikimori_2-berserk')).toBe(true)
    expect(mangaStore.isSelected('shikimori_20-naruto')).toBe(false)
    expect(mangaStore.extractNumericId('shikimori_2-berserk')).toBe(2)
  })
})
