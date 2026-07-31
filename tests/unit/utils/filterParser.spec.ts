import { describe, expect, it } from 'vitest'
import {
  applyParsedFilters,
  hasFilter,
  matchesFilters,
  parseQueryFilters,
  parseSearchQuery,
  resolveSources,
  withFilter,
  withoutFilter,
  type IFilterableItem,
} from '@/core/utils/filterParser'

describe('parseQueryFilters', () => {
  it('returns plain text when there are no filters', () => {
    expect(parseQueryFilters('naruto shippuden')).toEqual({
      text: 'naruto shippuden',
      include: {},
      exclude: {},
    })
  })

  it('splits key:value filters out of the free text', () => {
    const filters = parseQueryFilters('titan genre:action status:watching')

    expect(filters.text).toBe('titan')
    expect(filters.include.genre).toEqual(['action'])
    expect(filters.include.status).toEqual(['watching'])
  })

  it('keeps colons inside a value', () => {
    expect(parseQueryFilters('anime:shiki_id:123').include.anime).toEqual(['shiki_id:123'])
  })

  it('collects repeated keys and deduplicates values', () => {
    expect(parseQueryFilters('genre:action genre:drama genre:action').include.genre).toEqual([
      'action',
      'drama',
    ])
  })

  it('treats a leading dash as exclusion', () => {
    const filters = parseQueryFilters('titan -genre:comedy')

    expect(filters.exclude.genre).toEqual(['comedy'])
    expect(filters.include.genre).toBeUndefined()
  })

  it('supports quoted multi-word values and lowercases keys', () => {
    expect(parseQueryFilters('Genre:"slice of life"').include.genre).toEqual(['slice of life'])
  })

  it('ignores a filter with an empty value', () => {
    expect(parseQueryFilters('genre:').include).toEqual({})
  })
})

describe('resolveSources', () => {
  it('defaults to both sources', () => {
    expect(resolveSources(parseQueryFilters('naruto'))).toEqual(['shikimori', 'aniliberty'])
  })

  it('narrows to a requested source', () => {
    expect(resolveSources(parseQueryFilters('source:aniliberty'))).toEqual(['aniliberty'])
  })

  it('drops an excluded source', () => {
    expect(resolveSources(parseQueryFilters('-source:aniliberty'))).toEqual(['shikimori'])
  })

  it('falls back to both sources when the filter leaves nothing', () => {
    expect(resolveSources(parseQueryFilters('source:mal'))).toEqual(['shikimori', 'aniliberty'])
  })
})

describe('parseSearchQuery', () => {
  it('reads an anime reference for both id flavours', () => {
    expect(parseSearchQuery('anime:shiki_id:123').animeId).toEqual({
      source: 'shikimori',
      id: 123,
    })
    expect(parseSearchQuery('anime:liberty_id:7').animeId).toEqual({
      source: 'aniliberty',
      id: 7,
    })
  })

  it('reads a manga reference', () => {
    expect(parseSearchQuery('manga:shiki_id:2').mangaId).toEqual({ source: 'shikimori', id: 2 })
  })

  it('ignores a malformed media reference', () => {
    expect(parseSearchQuery('anime:mal_id:5').animeId).toBeUndefined()
  })

  it('reads genre, year, status and tag', () => {
    const filters = parseSearchQuery('genre:action year:2013 status:watching tag:favorite titan')

    expect(filters.genre).toBe('action')
    expect(filters.year).toBe(2013)
    expect(filters.status).toBe('watching')
    expect(filters.tag).toBe('favorite')
    expect(filters.freeText).toBe('titan')
  })

  it('rejects an unknown status', () => {
    expect(parseSearchQuery('status:paused').status).toBeUndefined()
  })

  it('rejects a non-numeric year', () => {
    expect(parseSearchQuery('year:soon').year).toBeUndefined()
  })

  it('is case-insensitive on filter keys and status values', () => {
    const filters = parseSearchQuery('STATUS:Watching ANIME:SHIKI_ID:9')

    expect(filters.status).toBe('watching')
    expect(filters.animeId).toEqual({ source: 'shikimori', id: 9 })
  })
})

describe('applyParsedFilters', () => {
  const items: IFilterableItem[] = [
    { status: 'watching', genres: ['Action', 'Drama'], airedFrom: '2013-04-07', myTags: ['fav'] },
    { status: 'completed', genres: ['Sci-Fi'], airedFrom: '2011-04-06', myTags: [] },
    { status: 'watching', genres: ['Action'], airedFrom: '2011-10-02' },
  ]

  it('filters by genre substring', () => {
    expect(applyParsedFilters(items, { genre: 'action', freeText: '' })).toHaveLength(2)
  })

  it('filters by year prefix', () => {
    expect(applyParsedFilters(items, { year: 2011, freeText: '' })).toHaveLength(2)
  })

  it('filters by exact status', () => {
    expect(applyParsedFilters(items, { status: 'completed', freeText: '' })).toHaveLength(1)
  })

  it('filters by tag', () => {
    expect(applyParsedFilters(items, { tag: 'fav', freeText: '' })).toHaveLength(1)
  })

  it('combines every filter', () => {
    expect(
      applyParsedFilters(items, { genre: 'action', year: 2013, status: 'watching', freeText: '' }),
    ).toHaveLength(1)
  })

  it('returns everything when no filter is set', () => {
    expect(applyParsedFilters(items, { freeText: 'titan' })).toHaveLength(3)
  })
})

describe('matchesFilters', () => {
  const item: IFilterableItem = {
    status: 'watching',
    genres: ['Action', 'Drama'],
    airedFrom: '2013-04-07',
    myTags: ['favorite'],
  }

  it('requires every included genre', () => {
    expect(matchesFilters(item, parseQueryFilters('genre:action genre:drama'))).toBe(true)
    expect(matchesFilters(item, parseQueryFilters('genre:action genre:comedy'))).toBe(false)
  })

  it('rejects an excluded genre', () => {
    expect(matchesFilters(item, parseQueryFilters('-genre:action'))).toBe(false)
  })

  it('matches on status, tag and year', () => {
    expect(matchesFilters(item, parseQueryFilters('status:watching'))).toBe(true)
    expect(matchesFilters(item, parseQueryFilters('tag:favorite'))).toBe(true)
    expect(matchesFilters(item, parseQueryFilters('year:2013'))).toBe(true)
    expect(matchesFilters(item, parseQueryFilters('year:2011'))).toBe(false)
  })
})

describe('query token helpers', () => {
  it('adds a filter without duplicating it', () => {
    const once = withFilter('titan', 'genre', 'action')

    expect(once).toBe('titan genre:action')
    expect(withFilter(once, 'genre', 'action')).toBe(once)
  })

  it('quotes multi-word values', () => {
    expect(withFilter('', 'genre', 'slice of life')).toBe('genre:"slice of life"')
  })

  it('removes one value but keeps the others', () => {
    expect(withoutFilter('genre:action genre:drama titan', 'genre', 'action')).toBe(
      'genre:drama titan',
    )
  })

  it('removes every value for a key when no value is given', () => {
    expect(withoutFilter('genre:action genre:drama titan', 'genre')).toBe('titan')
  })

  it('reports whether a filter is present', () => {
    expect(hasFilter('genre:action', 'genre', 'action')).toBe(true)
    expect(hasFilter('genre:action', 'genre', 'drama')).toBe(false)
  })
})
