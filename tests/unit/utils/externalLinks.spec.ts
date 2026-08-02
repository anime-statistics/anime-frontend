import { describe, expect, it } from 'vitest'
import { buildExternalUrl, buildInternalUrl, ensureApiUrl } from '@/core/utils/externalLinks'

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

describe('ensureApiUrl', () => {
  it('inserts /api in front of the path', () => {
    expect(ensureApiUrl('https://shikimori.one/animes/5114')).toBe(
      'https://shikimori.one/api/animes/5114',
    )
  })

  it('leaves an address that already points at the api alone', () => {
    expect(ensureApiUrl('https://shikimori.one/api/animes/5114')).toBe(
      'https://shikimori.one/api/animes/5114',
    )
  })

  it('does not mistake an /apixyz path for the api', () => {
    expect(ensureApiUrl('https://aniliberty.top/apiary/anime')).toBe(
      'https://aniliberty.top/api/apiary/anime',
    )
  })

  it('handles a bare origin and keeps the query string', () => {
    expect(ensureApiUrl('https://aniliberty.top')).toBe('https://aniliberty.top/api')
    expect(ensureApiUrl('https://aniliberty.top/anime/frieren?season=1')).toBe(
      'https://aniliberty.top/api/anime/frieren?season=1',
    )
  })

  it('returns null for something that is not a url', () => {
    expect(ensureApiUrl('shikimori.one/animes/5114')).toBeNull()
    expect(ensureApiUrl('')).toBeNull()
  })
})
