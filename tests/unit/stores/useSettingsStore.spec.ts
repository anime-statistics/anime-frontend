import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  normaliseSettings,
  useSettingsStore,
} from '@/stores/useSettingsStore'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('normaliseSettings', () => {
  it('falls back to defaults for a non-object', () => {
    expect(normaliseSettings('nope')).toEqual(DEFAULT_SETTINGS)
  })

  it('rejects unknown enum values', () => {
    const result = normaliseSettings({ locale: 'jp', theme: 'neon', viewMode: 'grid' })

    expect(result.locale).toBe('ru')
    expect(result.theme).toBe('system')
    expect(result.viewMode).toBe('cards')
  })

  it('clamps numeric ranges', () => {
    expect(normaliseSettings({ columnsCount: 99 }).columnsCount).toBe(12)
    expect(normaliseSettings({ columnsCount: 0 }).columnsCount).toBe(1)
    expect(normaliseSettings({ pageSize: 1 }).pageSize).toBe(5)
  })

  it('keeps valid values', () => {
    const result = normaliseSettings({ locale: 'en', viewMode: 'kanban', columnsCount: 6 })

    expect(result.locale).toBe('en')
    expect(result.viewMode).toBe('kanban')
    expect(result.columnsCount).toBe(6)
  })
})

describe('useSettingsStore persistence', () => {
  it('starts from defaults when localStorage is empty', () => {
    const store = useSettingsStore()

    store.initFromLocalStorage()

    expect(store.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('restores settings written by persist', () => {
    const first = useSettingsStore()
    first.setViewMode('table')
    first.setColumns(8)
    first.persist()

    setActivePinia(createPinia())
    const second = useSettingsStore()
    second.initFromLocalStorage()

    expect(second.viewMode).toBe('table')
    expect(second.columns).toBe(8)
  })

  it('ignores corrupted storage payloads', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{not json')
    const store = useSettingsStore()

    store.initFromLocalStorage()

    expect(store.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('sanitises tampered storage payloads', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ viewMode: 'evil', pageSize: 9999 }))
    const store = useSettingsStore()

    store.initFromLocalStorage()

    expect(store.viewMode).toBe('cards')
    expect(store.settings.pageSize).toBe(100)
  })
})

describe('useSettingsStore theme', () => {
  it('adds the dark class when the theme is dark', () => {
    const store = useSettingsStore()

    store.setTheme('dark')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('removes the dark class when the theme is light', () => {
    const store = useSettingsStore()
    store.setTheme('dark')

    store.setTheme('light')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('follows the media query when the theme is system', () => {
    const store = useSettingsStore()

    store.setTheme('system')

    expect(store.prefersDark).toBe(window.matchMedia('(prefers-color-scheme: dark)').matches)
  })
})

describe('useSettingsStore reset', () => {
  it('returns every field to its default', () => {
    const store = useSettingsStore()
    store.update({ locale: 'en', viewMode: 'list', isAiEnabled: true })

    store.reset()

    expect(store.settings).toEqual(DEFAULT_SETTINGS)
  })
})
