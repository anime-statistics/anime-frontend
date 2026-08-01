import { describe, expect, it } from 'vitest'
import { totalRuntime } from '@/core/utils/runtime'

describe('totalRuntime', () => {
  it('multiplies episodes by their duration', () => {
    expect(totalRuntime(12, 24)).toEqual({ hours: 4, minutes: 48, totalMinutes: 288 })
  })

  it('keeps a sub-hour total in minutes only', () => {
    expect(totalRuntime(1, 45)).toEqual({ hours: 0, minutes: 45, totalMinutes: 45 })
  })

  it('reports a whole number of hours without stray minutes', () => {
    expect(totalRuntime(10, 30)).toEqual({ hours: 5, minutes: 0, totalMinutes: 300 })
  })

  // Announced titles have neither figure, and nothing watched is not a runtime.
  it.each([
    [0, 24],
    [12, 0],
    [undefined, 24],
    [12, undefined],
  ])('returns null for (%s episodes, %s minutes)', (episodes, minutes) => {
    expect(totalRuntime(episodes, minutes)).toBeNull()
  })
})
