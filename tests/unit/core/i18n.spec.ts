import { describe, expect, it } from 'vitest'
import en from '@/core/i18n/en.json'
import ru from '@/core/i18n/ru.json'
import { i18n, russianPluralIndex } from '@/core/i18n'
import type { AppMessageKey } from '@/core/i18n/types'

function flattenKeys(source: unknown, prefix = ''): string[] {
  if (typeof source !== 'object' || source === null) return [prefix]

  return Object.entries(source).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  )
}

describe('russianPluralIndex', () => {
  it.each([
    [1, 0],
    [2, 1],
    [4, 1],
    [5, 2],
    [11, 2],
    [14, 2],
    [21, 0],
    [22, 1],
    [111, 2],
    [0, 2],
  ])('maps %i to form %i', (count, expected) => {
    expect(russianPluralIndex(count)).toBe(expected)
  })
})

describe('locale files', () => {
  it('define the same key set in en and ru', () => {
    expect(flattenKeys(ru).toSorted()).toEqual(flattenKeys(en).toSorted())
  })

  it('give russian plural messages three forms', () => {
    expect(ru.anime.episodes.split('|')).toHaveLength(3)
    expect(ru.manga.volumes.split('|')).toHaveLength(3)
    expect(ru.manga.chapters.split('|')).toHaveLength(3)
  })
})

describe('i18n instance', () => {
  const { t, locale } = i18n.global

  it('defaults to russian', () => {
    expect(locale.value).toBe('ru')
  })

  it.each([
    [1, '1 эпизод'],
    [2, '2 эпизода'],
    [5, '5 эпизодов'],
    [11, '11 эпизодов'],
    [21, '21 эпизод'],
  ])('pluralises %i episodes in russian', (count, expected) => {
    expect(t('anime.episodes', { count }, count)).toBe(expected)
  })

  it('pluralises manga volumes and chapters', () => {
    expect(t('manga.volumes', { count: 3 }, 3)).toBe('3 тома')
    expect(t('manga.chapters', { count: 12 }, 12)).toBe('12 глав')
  })

  it('interpolates named params', () => {
    expect(t('anime.watchedOf', { watched: 5, total: 12 })).toBe('Просмотрено 5 из 12')
  })

  it('types dotted message paths as a key union', () => {
    const key: AppMessageKey = 'anime.search.placeholder'

    expect(t(key)).toBe('Поиск аниме…')
  })

  it('falls back to english when the locale is switched', () => {
    locale.value = 'en'
    expect(t('collection.inCollection')).toBe('In collection')
    expect(t('anime.episodes', { count: 2 }, 2)).toBe('2 episodes')
    locale.value = 'ru'
  })
})
