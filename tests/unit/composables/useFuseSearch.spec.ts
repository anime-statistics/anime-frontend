import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import { useFuseSearch } from '@/composables/useFuseSearch'

function makeAnime(overrides: Partial<IAnimeSearchResultDto>): IAnimeSearchResultDto {
  return {
    id: 'shikimori_1-placeholder',
    source: 'shikimori',
    title: 'Placeholder',
    status: 'planned',
    episodesTotal: 12,
    ...overrides,
  } as IAnimeSearchResultDto
}

const items = ref<IAnimeSearchResultDto[]>([
  makeAnime({ id: 'shikimori_20-naruto', title: 'Naruto', titleEnglish: 'Naruto' }),
  makeAnime({
    id: 'shikimori_5114-fma',
    title: 'Fullmetal Alchemist: Brotherhood',
    titleJapanese: '鋼の錬金術師',
  }),
  makeAnime({ id: 'shikimori_21-one-piece', title: 'One Piece' }),
])

describe('useFuseSearch', () => {
  it('returns every item for an empty query', () => {
    const { search } = useFuseSearch(items)

    expect(search('')).toHaveLength(3)
    expect(search('   ')).toHaveLength(3)
  })

  it('finds an exact title', () => {
    const { search } = useFuseSearch(items)

    expect(search('One Piece').map((item) => item.title)).toContain('One Piece')
  })

  it('tolerates a typo', () => {
    const { search } = useFuseSearch(items)

    expect(search('narutoo')[0]?.title).toBe('Naruto')
  })

  it('matches on the japanese title too', () => {
    const { search } = useFuseSearch(items)

    expect(search('鋼の錬金術師')[0]?.title).toBe('Fullmetal Alchemist: Brotherhood')
  })

  it('returns nothing for an unrelated query', () => {
    const { search } = useFuseSearch(items)

    expect(search('zzzzzzzz')).toEqual([])
  })

  it('reindexes when the source list changes', () => {
    const source = ref<IAnimeSearchResultDto[]>([])
    const { search } = useFuseSearch(source)

    expect(search('Frieren')).toEqual([])

    source.value = [makeAnime({ id: 'shikimori_52991-frieren', title: 'Frieren' })]
    expect(search('Frieren')[0]?.title).toBe('Frieren')
  })
})
