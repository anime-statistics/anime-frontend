import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isObject } from '@/core/utils/caseConverter'
import type { IAppLocale, IAppSettings, IThemeMode, IViewMode } from '@/types/settings'

export const SETTINGS_STORAGE_KEY = 'anime-statistics:settings'
export const THEME_STORAGE_KEY = 'anime-statistics:theme'

const VIEW_MODES: IViewMode[] = ['cards', 'table', 'list', 'kanban']
const THEME_MODES: IThemeMode[] = ['light', 'dark', 'system']
const LOCALES: IAppLocale[] = ['ru', 'en']

export const DEFAULT_SETTINGS: IAppSettings = {
  locale: 'ru',
  theme: 'system',
  viewMode: 'cards',
  columnsCount: 4,
  pageSize: 20,
  isVoiceInputEnabled: false,
  isAiEnabled: false,
  llmProviders: [],
}

function pickFrom<T extends string>(allowed: T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

export function normaliseSettings(raw: unknown): IAppSettings {
  if (!isObject(raw)) return { ...DEFAULT_SETTINGS }

  return {
    locale: pickFrom(LOCALES, raw.locale, DEFAULT_SETTINGS.locale),
    theme: pickFrom(THEME_MODES, raw.theme, DEFAULT_SETTINGS.theme),
    viewMode: pickFrom(VIEW_MODES, raw.viewMode, DEFAULT_SETTINGS.viewMode),
    columnsCount: clampNumber(raw.columnsCount, 1, 12, DEFAULT_SETTINGS.columnsCount),
    pageSize: clampNumber(raw.pageSize, 5, 100, DEFAULT_SETTINGS.pageSize),
    isVoiceInputEnabled: raw.isVoiceInputEnabled === true,
    isAiEnabled: raw.isAiEnabled === true,
    llmProviders: Array.isArray(raw.llmProviders) ? [] : [],
    activeLlmProviderId:
      typeof raw.activeLlmProviderId === 'string' ? raw.activeLlmProviderId : undefined,
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<IAppSettings>({ ...DEFAULT_SETTINGS })

  const locale = computed(() => settings.value.locale)
  const viewMode = computed(() => settings.value.viewMode)
  const columns = computed(() => settings.value.columnsCount)
  const isVoiceInputEnabled = computed(() => settings.value.isVoiceInputEnabled)

  const prefersDark = computed(() => {
    if (settings.value.theme !== 'system') return settings.value.theme === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  function applyTheme(): void {
    document.documentElement.classList.toggle('dark', prefersDark.value)
    localStorage.setItem(THEME_STORAGE_KEY, prefersDark.value ? 'dark' : 'light')
  }

  function persist(): void {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
    applyTheme()
  }

  function initFromLocalStorage(): void {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      try {
        settings.value = normaliseSettings(JSON.parse(stored))
      } catch {
        settings.value = { ...DEFAULT_SETTINGS }
      }
    }
    applyTheme()
  }

  function update(patch: Partial<IAppSettings>): void {
    settings.value = normaliseSettings({ ...settings.value, ...patch })
  }

  function setTheme(theme: IThemeMode): void {
    update({ theme })
    applyTheme()
  }

  function setLocale(value: IAppLocale): void {
    update({ locale: value })
  }

  function setViewMode(mode: IViewMode): void {
    update({ viewMode: mode })
  }

  function setColumns(count: number): void {
    update({ columnsCount: count })
  }

  function reset(): void {
    settings.value = { ...DEFAULT_SETTINGS }
    applyTheme()
  }

  return {
    settings,
    locale,
    viewMode,
    columns,
    isVoiceInputEnabled,
    prefersDark,
    applyTheme,
    persist,
    initFromLocalStorage,
    update,
    setTheme,
    setLocale,
    setViewMode,
    setColumns,
    reset,
  }
})
