import { describe, expect, it } from 'vitest'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import { computeSimilarity, deduplicateResults } from '@/mocks/mediaAdapter'

function anime(overrides: Partial<IAnimeSearchResultDto>): IAnimeSearchResultDto {
  return {
    id: 'shikimori_1-placeholder',
    title: 'Placeholder',
    episodesTotal: 12,
    status: 'completed',
    source: 'shikimori',
    ...overrides,
  }
}

describe('computeSimilarity', () => {
  it('scores identical entries at 1', () => {
    const entry = anime({ title: 'Steins;Gate', titleEnglish: 'Steins;Gate' })

    expect(computeSimilarity(entry, entry)).toBe(1)
  })

  it('treats punctuation differences as identical titles', () => {
    const left = anime({ title: 'Steins;Gate', source: 'shikimori' })
    const right = anime({ title: 'Steins Gate', source: 'aniliberty' })

    expect(computeSimilarity(left, right)).toBe(1)
  })

  it('scores unrelated entries below the merge threshold', () => {
    const left = anime({ title: 'Death Note', episodesTotal: 37, airedFrom: '2006-10-04' })
    const right = anime({ title: 'One Piece', episodesTotal: 1100, airedFrom: '1999-10-20' })

    expect(computeSimilarity(left, right)).toBeLessThan(0.7)
  })

  it('skips components missing on either side instead of penalising them', () => {
    const left = anime({ title: 'Frieren', genres: ['Fantasy'] })
    const right = anime({ title: 'Frieren' })

    expect(computeSimilarity(left, right)).toBe(1)
  })

  it('recognises a match through english titles when native titles differ', () => {
    const left = anime({
      title: 'Shingeki no Kyojin',
      titleEnglish: 'Attack on Titan',
      episodesTotal: 25,
      airedFrom: '2013-04-07',
      genres: ['Action', 'Drama', 'Fantasy'],
    })
    const right = anime({
      title: 'Атака титанов',
      titleEnglish: 'Attack on Titan',
      episodesTotal: 25,
      airedFrom: '2013-04-07',
      genres: ['Action', 'Drama'],
      source: 'aniliberty',
    })

    expect(computeSimilarity(left, right)).toBeGreaterThan(0.7)
  })
})

describe('deduplicateResults', () => {
  it('returns the input unchanged when nothing matches', () => {
    const items = [
      anime({ id: 'shikimori_1-a', title: 'Death Note', episodesTotal: 37 }),
      anime({ id: 'shikimori_2-b', title: 'One Piece', episodesTotal: 1100 }),
    ]

    expect(deduplicateResults(items)).toHaveLength(2)
  })

  it('prefers the shikimori entry as the primary card', () => {
    const items = [
      anime({ id: 'aniliberty_1-steins-gate', title: 'Steins Gate', source: 'aniliberty' }),
      anime({ id: 'shikimori_2-steins-gate', title: 'Steins;Gate', source: 'shikimori' }),
    ]

    const [merged] = deduplicateResults(items)

    expect(merged.source).toBe('shikimori')
    expect(merged.id).toBe('shikimori_2-steins-gate')
    expect(merged.secondarySource).toBe('aniliberty')
  })

  it('fills gaps in the primary entry from the secondary one', () => {
    const items = [
      anime({ id: 'shikimori_2-steins-gate', title: 'Steins;Gate', source: 'shikimori' }),
      anime({
        id: 'aniliberty_1-steins-gate',
        title: 'Steins Gate',
        source: 'aniliberty',
        synopsis: 'A mad scientist sends messages to the past.',
      }),
    ]

    const [merged] = deduplicateResults(items)

    expect(merged.synopsis).toBe('A mad scientist sends messages to the past.')
  })

  it('leaves same-source duplicates without a secondarySource', () => {
    const items = [
      anime({ id: 'shikimori_1-steins-gate', title: 'Steins;Gate' }),
      anime({ id: 'shikimori_2-steins-gate', title: 'Steins Gate' }),
    ]

    const [merged] = deduplicateResults(items)

    expect(merged.secondarySource).toBeUndefined()
  })
})
