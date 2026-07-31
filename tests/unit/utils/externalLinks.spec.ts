import { describe, expect, it } from 'vitest'
import { buildExternalUrl, buildInternalUrl } from '@/core/utils/externalLinks'

describe('buildExternalUrl', () => {
  it('builds a shikimori anime url from the numeric id', () => {
    expect(buildExternalUrl('shikimori_5114-fullmetal-alchemist-brotherhood')).toBe(
      'https://shikimori.one/animes/5114',
    )
  })

  it('builds a shikimori manga url', () => {
    expect(buildExternalUrl('shikimori_2-berserk', 'manga')).toBe(
      'https://shikimori.one/mangas/2',
    )
  })

  it('builds an aniliberty url from the slug', () => {
    expect(buildExternalUrl('aniliberty_311-frieren')).toBe(
      'https://aniliberty.top/anime/frieren',
    )
  })

  it('returns null for a malformed media id', () => {
    expect(buildExternalUrl('not-an-id')).toBeNull()
  })
})

describe('buildInternalUrl', () => {
  it('points at the in-app detail route', () => {
    expect(buildInternalUrl('shikimori_2-berserk', 'manga')).toBe('/manga/shikimori_2-berserk')
    expect(buildInternalUrl('shikimori_20-naruto')).toBe('/anime/shikimori_20-naruto')
  })
})
