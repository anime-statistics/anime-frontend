import { diffLines } from 'diff'

export type DiffRowKind = 'add' | 'remove' | 'context'

export interface IDiffRow {
  kind: DiffRowKind
  text: string
  oldLine?: number
  newLine?: number
}

export interface IDiffHunk {
  header: string
  rows: IDiffRow[]
}

export const DIFF_CONTEXT_LINES = 3

function splitLines(value: string): string[] {
  const lines = value.split('\n')
  // A trailing newline closes the last line rather than opening an empty one.
  if (lines.at(-1) === '') lines.pop()
  return lines
}

// Without a closing newline the last line has no boundary, so appending a line
// reads as "removed the old last line, added two" instead of a plain addition.
function withFinalNewline(value: string): string {
  if (!value) return value
  return value.endsWith('\n') ? value : `${value}\n`
}

// Line numbers are tracked separately per side, exactly like a unified diff:
// a removed line advances only the old counter, an added line only the new one.
export function buildDiffRows(before: string, after: string): IDiffRow[] {
  const rows: IDiffRow[] = []
  let oldLine = 1
  let newLine = 1

  for (const change of diffLines(withFinalNewline(before), withFinalNewline(after))) {
    for (const text of splitLines(change.value)) {
      if (change.added) {
        rows.push({ kind: 'add', text, newLine })
        newLine += 1
      } else if (change.removed) {
        rows.push({ kind: 'remove', text, oldLine })
        oldLine += 1
      } else {
        rows.push({ kind: 'context', text, oldLine, newLine })
        oldLine += 1
        newLine += 1
      }
    }
  }

  return rows
}

// Only the neighbourhood of each change is worth showing; long untouched
// stretches collapse away and each surviving block gets an @@ header.
export function buildDiffHunks(
  rows: readonly IDiffRow[],
  context = DIFF_CONTEXT_LINES,
): IDiffHunk[] {
  const ranges: [number, number][] = []

  for (const [index, row] of rows.entries()) {
    if (row.kind === 'context') continue

    const from = Math.max(0, index - context)
    const to = Math.min(rows.length - 1, index + context)
    const previous = ranges.at(-1)

    // Touching or overlapping neighbourhoods read better as one block.
    if (previous && from <= previous[1] + 1) previous[1] = Math.max(previous[1], to)
    else ranges.push([from, to])
  }

  return ranges.map(([from, to]) => {
    const slice = rows.slice(from, to + 1)
    const oldLines = slice.filter((row) => row.oldLine !== undefined)
    const newLines = slice.filter((row) => row.newLine !== undefined)

    return {
      header: `@@ -${oldLines[0]?.oldLine ?? 0},${oldLines.length}`
        + ` +${newLines[0]?.newLine ?? 0},${newLines.length} @@`,
      rows: slice,
    }
  })
}

export interface IDiffStats {
  added: number
  removed: number
}

export function countDiff(rows: readonly IDiffRow[]): IDiffStats {
  return {
    added: rows.filter((row) => row.kind === 'add').length,
    removed: rows.filter((row) => row.kind === 'remove').length,
  }
}
