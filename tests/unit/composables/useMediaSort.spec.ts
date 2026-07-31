import { describe, expect, it } from 'vitest'
import { sortItems, type ISortableItem } from '@/composables/useMediaSort'

const items: ISortableItem[] = [
  { title: 'One Piece', score: 8.7, episodesTotal: 1100, airedFrom: '1999-10-20' },
  { title: 'Death Note', score: 8.6, episodesTotal: 37, airedFrom: '2006-10-04' },
  { title: 'Frieren', episodesTotal: 28, airedFrom: '2023-09-29' },
]

describe('sortItems', () => {
  it('sorts strings alphabetically', () => {
    expect(sortItems(items, 'title', 'asc').map((item) => item.title)).toEqual([
      'Death Note',
      'Frieren',
      'One Piece',
    ])
  })

  it('reverses on descending order', () => {
    expect(sortItems(items, 'title', 'desc').map((item) => item.title)).toEqual([
      'One Piece',
      'Frieren',
      'Death Note',
    ])
  })

  it('sorts numbers numerically rather than lexicographically', () => {
    expect(sortItems(items, 'episodesTotal', 'asc').map((item) => item.episodesTotal)).toEqual([
      28, 37, 1100,
    ])
  })

  it('sorts dates by their ISO prefix', () => {
    expect(sortItems(items, 'airedFrom', 'asc').map((item) => item.title)).toEqual([
      'One Piece',
      'Death Note',
      'Frieren',
    ])
  })

  it('keeps entries without a value at the bottom in both directions', () => {
    expect(sortItems(items, 'score', 'asc').at(-1)?.title).toBe('Frieren')
    expect(sortItems(items, 'score', 'desc').at(-1)?.title).toBe('Frieren')
  })

  it('does not mutate the input array', () => {
    const original = [...items]
    sortItems(items, 'title', 'desc')

    expect(items).toEqual(original)
  })
})
