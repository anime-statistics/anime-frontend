import { describe, expect, it } from 'vitest'
import { deepMapKeys, isObject, toCamelCase, toSnakeCase } from '@/core/utils/caseConverter'
import { snakeCase } from 'change-case'

describe('isObject', () => {
  it('accepts plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it('rejects null, arrays and primitives', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject('str')).toBe(false)
    expect(isObject(42)).toBe(false)
    expect(isObject(undefined)).toBe(false)
  })
})

describe('toCamelCase', () => {
  it('converts nested object keys', () => {
    const input = {
      anime_id: 1,
      title_english: 'Naruto',
      nested_data: { episodes_total: 220, aired_from: '2002-10-03' },
    }

    expect(toCamelCase(input)).toEqual({
      animeId: 1,
      titleEnglish: 'Naruto',
      nestedData: { episodesTotal: 220, airedFrom: '2002-10-03' },
    })
  })

  it('converts keys inside arrays of objects', () => {
    const input = { related_anime: [{ media_id: 'a' }, { media_id: 'b' }] }

    expect(toCamelCase(input)).toEqual({ relatedAnime: [{ mediaId: 'a' }, { mediaId: 'b' }] })
  })

  it('leaves Date instances untouched', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const input: Record<string, unknown> = { created_at: createdAt }
    const result = toCamelCase(input)

    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.createdAt).toBe(createdAt)
  })

  it('preserves null and undefined values', () => {
    expect(toCamelCase({ image_url: null, aired_to: undefined })).toEqual({
      imageUrl: null,
      airedTo: undefined,
    })
  })

  it('returns primitives unchanged', () => {
    expect(toCamelCase(null)).toBeNull()
    expect(toCamelCase(undefined)).toBeUndefined()
    expect(toCamelCase('plain')).toBe('plain')
    expect(toCamelCase(7)).toBe(7)
  })
})

describe('toSnakeCase', () => {
  it('converts nested object keys back to snake_case', () => {
    const input = { animeId: 1, nestedData: { episodesTotal: 220 } }

    expect(toSnakeCase(input)).toEqual({ anime_id: 1, nested_data: { episodes_total: 220 } })
  })

  it('is idempotent for keys already in snake_case', () => {
    expect(toSnakeCase({ image_url: 'x' })).toEqual({ image_url: 'x' })
  })
})

describe('deepMapKeys', () => {
  it('applies an arbitrary mapping function', () => {
    expect(deepMapKeys({ aB: 1 }, (key) => key.toUpperCase())).toEqual({ AB: 1 })
  })

  it('does not mutate the source object', () => {
    const source = { anime_id: 1 }
    deepMapKeys(source, snakeCase)

    expect(source).toEqual({ anime_id: 1 })
  })
})
