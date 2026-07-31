import { describe, expect, it } from 'vitest'
import { pluralize, type PluralForms } from '@/core/utils/pluralize'

const EPISODES: PluralForms = ['эпизод', 'эпизода', 'эпизодов']

describe('pluralize', () => {
  it.each([
    [1, '1 эпизод'],
    [2, '2 эпизода'],
    [5, '5 эпизодов'],
    [21, '21 эпизод'],
    [111, '111 эпизодов'],
  ])('formats %i correctly', (count, expected) => {
    expect(pluralize(count, EPISODES)).toBe(expected)
  })

  it('handles the 11-19 exception range', () => {
    expect(pluralize(11, EPISODES)).toBe('11 эпизодов')
    expect(pluralize(14, EPISODES)).toBe('14 эпизодов')
    expect(pluralize(19, EPISODES)).toBe('19 эпизодов')
  })

  it('handles zero and negative counts', () => {
    expect(pluralize(0, EPISODES)).toBe('0 эпизодов')
    expect(pluralize(-1, EPISODES)).toBe('-1 эпизод')
    expect(pluralize(-3, EPISODES)).toBe('-3 эпизода')
  })

  it('handles hundreds boundaries', () => {
    expect(pluralize(101, EPISODES)).toBe('101 эпизод')
    expect(pluralize(102, EPISODES)).toBe('102 эпизода')
    expect(pluralize(100, EPISODES)).toBe('100 эпизодов')
  })
})
