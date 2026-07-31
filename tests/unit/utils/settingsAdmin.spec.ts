import { beforeEach, describe, expect, it } from 'vitest'
import { buildBrandPalette, hexToRgb } from '@/core/utils/colorPalette'
import { clearSecret, readSecret, saveSecret } from '@/core/utils/secureStorage'
import { useSyncHistory, SYNC_HISTORY_KEY, MAX_SYNC_HISTORY } from '@/composables/useSyncHistory'
import { DEFAULT_SETTINGS, normaliseSettings } from '@/stores/useSettingsStore'

beforeEach(() => {
  localStorage.clear()
})

describe('secureStorage', () => {
  it('round-trips a secret', () => {
    saveSecret('llm-api-key', 'sk-test-1234')

    expect(readSecret('llm-api-key')).toBe('sk-test-1234')
  })

  it('does not store the raw value', () => {
    saveSecret('llm-api-key', 'sk-test-1234')

    const stored = localStorage.getItem('anime-statistics:secret:llm-api-key')
    expect(stored).not.toBeNull()
    expect(stored).not.toContain('sk-test-1234')
  })

  it('supports non-latin values', () => {
    saveSecret('llm-api-key', 'ключ-例え-🔑')

    expect(readSecret('llm-api-key')).toBe('ключ-例え-🔑')
  })

  it('removes the entry when saving an empty value', () => {
    saveSecret('llm-api-key', 'sk-test')
    saveSecret('llm-api-key', '')

    expect(localStorage.getItem('anime-statistics:secret:llm-api-key')).toBeNull()
  })

  it('returns an empty string for a corrupted entry', () => {
    localStorage.setItem('anime-statistics:secret:llm-api-key', '!!!not-base64!!!')

    expect(readSecret('llm-api-key')).toBe('')
  })

  it('clears a secret', () => {
    saveSecret('llm-api-key', 'sk-test')
    clearSecret('llm-api-key')

    expect(readSecret('llm-api-key')).toBe('')
  })
})

function luminance(triplet: string): number {
  return triplet.split(' ').reduce((sum, channel) => sum + Number(channel), 0)
}

describe('colorPalette', () => {
  it('parses hex colours with or without the hash', () => {
    expect(hexToRgb('#6366f1')).toEqual([99, 102, 241])
    expect(hexToRgb('6366f1')).toEqual([99, 102, 241])
  })

  it('rejects malformed colours', () => {
    expect(hexToRgb('#fff')).toBeNull()
    expect(hexToRgb('tomato')).toBeNull()
  })

  it('keeps the base colour as shade 500', () => {
    expect(buildBrandPalette('#6366f1')?.[500]).toBe('99 102 241')
  })

  it('orders shades from light to dark', () => {
    const palette = buildBrandPalette('#6366f1')
    if (!palette) throw new Error('palette expected')

    expect(luminance(palette[50])).toBeGreaterThan(luminance(palette[500]))
    expect(luminance(palette[500])).toBeGreaterThan(luminance(palette[900]))
  })

  it('returns null for an invalid base colour', () => {
    expect(buildBrandPalette('nope')).toBeNull()
  })
})

describe('useSyncHistory', () => {
  it('prepends entries newest first', () => {
    const history = useSyncHistory()
    history.record('ok', 3)
    history.record('error', 0)

    expect(history.entries.value[0].status).toBe('error')
    expect(history.entries.value[1].changes).toBe(3)
  })

  it('caps the history length', () => {
    const history = useSyncHistory()
    for (let index = 0; index < MAX_SYNC_HISTORY + 5; index += 1) {
      history.record('ok', index)
    }

    expect(history.entries.value).toHaveLength(MAX_SYNC_HISTORY)
  })

  it('survives reload through localStorage', () => {
    useSyncHistory().record('ok', 2)

    expect(useSyncHistory().entries.value).toHaveLength(1)
  })

  it('drops corrupted payloads', () => {
    localStorage.setItem(SYNC_HISTORY_KEY, '{broken')

    expect(useSyncHistory().entries.value).toEqual([])
  })
})

describe('settings normalisation for the admin page', () => {
  it('clamps the new numeric fields', () => {
    const result = normaliseSettings({
      aiModelId: 'claude-sonnet-4-5',
      aiMaxTokens: 99_999,
      uiFontSize: 8,
    })

    expect(result.aiMaxTokens).toBe(8192)
    expect(result.uiFontSize).toBe(12)
  })

  it('rejects an invalid primary colour and density', () => {
    const result = normaliseSettings({ uiPrimaryColor: 'red', uiDensity: 'spacious' })

    expect(result.uiPrimaryColor).toBe(DEFAULT_SETTINGS.uiPrimaryColor)
    expect(result.uiDensity).toBe('standard')
  })

  it('keeps valid appearance and sync values', () => {
    const result = normaliseSettings({
      aiModelId: 'gpt-4o',
      uiPrimaryColor: '#10b981',
      uiDensity: 'compact',
      uiFontSize: 18,
      syncInterval: '30m',
      autoCommitShikimori: true,
    })

    expect(result.uiPrimaryColor).toBe('#10b981')
    expect(result.uiDensity).toBe('compact')
    expect(result.uiFontSize).toBe(18)
    expect(result.syncInterval).toBe('30m')
    expect(result.autoCommitShikimori).toBe(true)
  })
})
