import { describe, expect, it } from 'vitest'
import { draftKey } from '@/composables/useNoteDraft'
import { noteFileName } from '@/core/utils/exportNote'

describe('noteFileName', () => {
  it('uses the first non-empty line', () => {
    expect(noteFileName('\n\nSteins;Gate notes\nmore text', 'fallback')).toBe('Steins;Gate notes')
  })

  it('strips markdown heading markers', () => {
    expect(noteFileName('### Прогресс\nтекст', 'fallback')).toBe('Прогресс')
  })

  it('falls back when the content is blank', () => {
    expect(noteFileName('   \n  ', 'Без названия')).toBe('Без названия')
  })

  it('replaces characters that are illegal in file names', () => {
    expect(noteFileName('a/b:c*d?e"f<g>h|i', 'fallback')).toBe('a-b-c-d-e-f-g-h-i')
  })

  it('truncates a very long first line', () => {
    expect(noteFileName('x'.repeat(200), 'fallback')).toHaveLength(60)
  })
})

describe('draftKey', () => {
  it('scopes the key by media and note', () => {
    expect(draftKey('shikimori_20-naruto', 'note-1')).toBe(
      'anime-statistics:note-draft:shikimori_20-naruto:note-1',
    )
  })

  it('uses a "new" suffix for an unsaved note', () => {
    expect(draftKey('shikimori_20-naruto', null)).toBe(
      'anime-statistics:note-draft:shikimori_20-naruto:new',
    )
  })
})
