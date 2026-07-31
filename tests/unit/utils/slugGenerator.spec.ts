import { describe, expect, it } from 'vitest'
import { buildMediaId, generateSlug, parseMediaId } from '@/core/utils/slugGenerator'

describe('generateSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(generateSlug('Naruto Shippuden')).toBe('naruto-shippuden')
  })

  it('collapses runs of non-alphanumeric characters', () => {
    expect(generateSlug('Fate/stay night: Unlimited Blade Works')).toBe(
      'fate-stay-night-unlimited-blade-works',
    )
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('!!! Bleach !!!')).toBe('bleach')
  })
})

describe('buildMediaId', () => {
  it('builds a source-prefixed id', () => {
    expect(buildMediaId('shikimori', 12345, 'Naruto Shippuden')).toBe(
      'shikimori_12345-naruto-shippuden',
    )
  })

  it('supports the aniliberty source', () => {
    expect(buildMediaId('aniliberty', 7, 'Steins Gate')).toBe('aniliberty_7-steins-gate')
  })
})

describe('parseMediaId', () => {
  it('round-trips a built id', () => {
    const mediaId = buildMediaId('shikimori', 12345, 'Naruto Shippuden')

    expect(parseMediaId(mediaId)).toEqual({
      source: 'shikimori',
      id: 12345,
      slug: 'naruto-shippuden',
    })
  })

  it('returns null for a malformed id', () => {
    expect(parseMediaId('not-a-media-id')).toBeNull()
    expect(parseMediaId('mal_1-naruto')).toBeNull()
    expect(parseMediaId('shikimori_abc-naruto')).toBeNull()
  })
})
