import { describe, expect, it } from 'vitest'
import { buildDiffHunks, buildDiffRows, countDiff } from '@/core/utils/noteDiff'

const BEFORE = ['one', 'two', 'three', 'four', 'five'].join('\n')

describe('buildDiffRows', () => {
  it('marks nothing when the text is unchanged', () => {
    const rows = buildDiffRows(BEFORE, BEFORE)

    expect(rows.every((row) => row.kind === 'context')).toBe(true)
    expect(countDiff(rows)).toEqual({ added: 0, removed: 0 })
  })

  it('numbers each side separately', () => {
    const rows = buildDiffRows('a\nb', 'a\nB')

    expect(rows).toEqual([
      { kind: 'context', text: 'a', oldLine: 1, newLine: 1 },
      { kind: 'remove', text: 'b', oldLine: 2 },
      { kind: 'add', text: 'B', newLine: 2 },
    ])
  })

  it('does not invent a trailing empty line', () => {
    expect(buildDiffRows('a\n', 'a\n')).toHaveLength(1)
  })

  // A missing trailing newline would otherwise make appending a line look like
  // the previous last line was rewritten.
  it('counts an appended line as one addition', () => {
    const rows = buildDiffRows(BEFORE, ['one', 'two', 'THREE', 'four', 'five', 'six'].join('\n'))

    expect(countDiff(rows)).toEqual({ added: 2, removed: 1 })
  })
})

describe('buildDiffHunks', () => {
  it('returns no hunks when nothing changed', () => {
    expect(buildDiffHunks(buildDiffRows(BEFORE, BEFORE))).toEqual([])
  })

  it('collapses untouched stretches and keeps the surrounding context', () => {
    const before = Array.from({ length: 40 }, (_unused, index) => `line ${index + 1}`).join('\n')
    const after = before.replace('line 20', 'line twenty')

    const [hunk, ...rest] = buildDiffHunks(buildDiffRows(before, after), 3)

    expect(rest).toEqual([])
    expect(hunk.rows).toHaveLength(8)
    expect(hunk.rows[0].text).toBe('line 17')
    expect(hunk.rows.at(-1)?.text).toBe('line 23')
  })

  it('merges changes that sit within one context window of each other', () => {
    const before = Array.from({ length: 20 }, (_unused, index) => `line ${index + 1}`).join('\n')
    const after = before.replace('line 5', 'five').replace('line 8', 'eight')

    expect(buildDiffHunks(buildDiffRows(before, after), 3)).toHaveLength(1)
  })

  it('keeps distant changes in separate hunks', () => {
    const before = Array.from({ length: 40 }, (_unused, index) => `line ${index + 1}`).join('\n')
    const after = before.replace('line 5', 'five').replace('line 30', 'thirty')

    expect(buildDiffHunks(buildDiffRows(before, after), 3)).toHaveLength(2)
  })

  it('writes a unified header with both line ranges', () => {
    const [hunk] = buildDiffHunks(buildDiffRows('a\nb\nc', 'a\nB\nc'), 1)

    expect(hunk.header).toBe('@@ -1,3 +1,3 @@')
  })
})
