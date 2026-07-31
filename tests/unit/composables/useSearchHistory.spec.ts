import { beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_HISTORY_ENTRIES,
  SEARCH_HISTORY_KEY,
  useSearchHistory,
} from '@/composables/useSearchHistory'

beforeEach(() => {
  localStorage.clear()
})

describe('useSearchHistory', () => {
  it('starts empty when nothing is stored', () => {
    expect(useSearchHistory().entries.value).toEqual([])
  })

  it('restores entries written by a previous session', () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['naruto', 'bleach']))

    expect(useSearchHistory().entries.value).toEqual(['naruto', 'bleach'])
  })

  it('ignores stored values that are not a string array', () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['naruto', 42, null]))

    expect(useSearchHistory().entries.value).toEqual(['naruto'])
  })

  it('ignores a non-array payload', () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify({ query: 'naruto' }))

    expect(useSearchHistory().entries.value).toEqual([])
  })

  it('survives corrupted JSON', () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, '{not json')

    expect(useSearchHistory().entries.value).toEqual([])
  })

  it('pushes the newest query to the front and persists it', () => {
    const history = useSearchHistory()

    history.push('naruto')
    history.push('bleach')

    expect(history.entries.value).toEqual(['bleach', 'naruto'])
    expect(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]')).toEqual([
      'bleach',
      'naruto',
    ])
  })

  it('moves a repeated query back to the front instead of duplicating it', () => {
    const history = useSearchHistory()

    history.push('naruto')
    history.push('bleach')
    history.push('naruto')

    expect(history.entries.value).toEqual(['naruto', 'bleach'])
  })

  it('trims whitespace and skips blank queries', () => {
    const history = useSearchHistory()

    history.push('  naruto  ')
    history.push('   ')

    expect(history.entries.value).toEqual(['naruto'])
  })

  it('caps the history length', () => {
    const history = useSearchHistory()

    for (let index = 0; index < MAX_HISTORY_ENTRIES + 5; index += 1) {
      history.push(`query-${index}`)
    }

    expect(history.entries.value).toHaveLength(MAX_HISTORY_ENTRIES)
    expect(history.entries.value[0]).toBe(`query-${MAX_HISTORY_ENTRIES + 4}`)
  })

  it('removes a single entry', () => {
    const history = useSearchHistory()
    history.push('naruto')
    history.push('bleach')

    history.remove('naruto')

    expect(history.entries.value).toEqual(['bleach'])
  })

  it('clears everything', () => {
    const history = useSearchHistory()
    history.push('naruto')

    history.clear()

    expect(history.entries.value).toEqual([])
    expect(localStorage.getItem(SEARCH_HISTORY_KEY)).toBe('[]')
  })
})
