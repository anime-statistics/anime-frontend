import { describe, expect, it } from 'vitest'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import {
  isAnimeSearchResultDto,
  isAnimeSearchResultDtoArray,
  validateAnimeSearchResultDto,
  validateAnimeSearchResultDtoArray,
} from '@/apis/validators/animeValidators'
import { isTagDto, validateTagDto } from '@/apis/validators/tagValidators'
import { isNoteDto } from '@/apis/validators/noteValidators'
import { isMangaSearchResultDto } from '@/apis/validators/mangaValidators'

const validAnime: IAnimeSearchResultDto = {
  id: 'shikimori_12345-naruto-shippuden',
  title: 'Naruto Shippuden',
  episodesTotal: 500,
  status: 'watching',
  source: 'shikimori',
}

describe('anime validators', () => {
  it('accepts a valid DTO', () => {
    expect(isAnimeSearchResultDto(validAnime)).toBe(true)
  })

  it('rejects a malformed media id', () => {
    expect(isAnimeSearchResultDto({ ...validAnime, id: 'naruto' })).toBe(false)
  })

  it('rejects an unknown status', () => {
    expect(isAnimeSearchResultDto({ ...validAnime, status: 'paused' })).toBe(false)
  })

  it('rejects a score above 10', () => {
    expect(isAnimeSearchResultDto({ ...validAnime, score: 11 })).toBe(false)
  })

  it('accepts zero episodes for an announced title', () => {
    expect(isAnimeSearchResultDto({ ...validAnime, episodesTotal: 0 })).toBe(true)
  })

  it('throws with validate* on invalid input', () => {
    expect(() => validateAnimeSearchResultDto({ ...validAnime, episodesTotal: -1 })).toThrow()
  })

  it('returns parsed data with validate* on valid input', () => {
    expect(validateAnimeSearchResultDto(validAnime)).toEqual(validAnime)
  })

  it('validates arrays', () => {
    expect(isAnimeSearchResultDtoArray([validAnime, validAnime])).toBe(true)
    expect(isAnimeSearchResultDtoArray([validAnime, { id: 'bad' }])).toBe(false)
    expect(validateAnimeSearchResultDtoArray([validAnime])).toHaveLength(1)
  })

  it('throws when validate*Array receives a non-array', () => {
    expect(() => validateAnimeSearchResultDtoArray(validAnime)).toThrow('Expected array')
  })
})

describe('manga validators', () => {
  it('accepts reading status and rejects rewatching', () => {
    const base = {
      id: 'shikimori_1-berserk',
      title: 'Berserk',
      volumesTotal: 41,
      chaptersTotal: 374,
      source: 'shikimori',
    }

    expect(isMangaSearchResultDto({ ...base, status: 'reading' })).toBe(true)
    expect(isMangaSearchResultDto({ ...base, status: 'rewatching' })).toBe(false)
  })
})

describe('tag validators', () => {
  const validTag = {
    id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    name: 'Любимое',
    color: '#6366f1',
    sortOrder: 0,
  }

  it('applies the isHidden default', () => {
    expect(validateTagDto(validTag).isHidden).toBe(false)
  })

  it('rejects a non-hex colour', () => {
    expect(isTagDto({ ...validTag, color: 'indigo' })).toBe(false)
  })

  it('rejects a non-uuid id', () => {
    expect(isTagDto({ ...validTag, id: '1' })).toBe(false)
  })
})

describe('note validators', () => {
  it('requires a uuid and timestamps', () => {
    expect(
      isNoteDto({
        id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
        mediaId: 'shikimori_12345-naruto-shippuden',
        content: 'Отличное аниме',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }),
    ).toBe(true)

    expect(isNoteDto({ id: '1', mediaId: 'x', content: '' })).toBe(false)
  })
})
