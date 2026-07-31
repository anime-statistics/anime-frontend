import { afterEach, describe, expect, it, vi } from 'vitest'
import { draftKey } from '@/composables/useNoteDraft'
import { downloadMarkdown, noteFileName, printHtml } from '@/core/utils/exportNote'

function stubObjectUrl(): { create: ReturnType<typeof vi.fn>, revoke: ReturnType<typeof vi.fn> } {
  const create = vi.fn(() => 'blob:note')
  const revoke = vi.fn()
  vi.stubGlobal('URL', { ...URL, createObjectURL: create, revokeObjectURL: revoke })
  return { create, revoke }
}

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

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('downloadMarkdown', () => {
  it('clicks a temporary link carrying the .md file name', () => {
    stubObjectUrl()
    const clicked: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
      this: HTMLAnchorElement,
    ) {
      clicked.push(this)
    })

    downloadMarkdown('# Заметка', 'Заметка')

    expect(clicked).toHaveLength(1)
    expect(clicked[0].download).toBe('Заметка.md')
    expect(clicked[0].href).toContain('blob:note')
  })

  it('releases the object URL and leaves no link behind', () => {
    const { revoke } = stubObjectUrl()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    downloadMarkdown('# Заметка', 'Заметка')

    expect(revoke).toHaveBeenCalledWith('blob:note')
    expect(document.querySelector('a')).toBeNull()
  })
})

describe('printHtml', () => {
  it('prints from a hidden iframe and cleans it up', () => {
    vi.useFakeTimers()
    const print = vi.fn()
    const focus = vi.fn()
    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue({
      print,
      focus,
    } as unknown as Window)

    printHtml('<p>текст</p>', 'Заметка')

    const frame = document.querySelector('iframe')
    expect(frame?.getAttribute('aria-hidden')).toBe('true')
    expect(print).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(1000)
    expect(document.querySelector('iframe')).toBeNull()
    vi.useRealTimers()
  })

  it('removes the iframe when the document is unavailable', () => {
    vi.spyOn(HTMLIFrameElement.prototype, 'contentDocument', 'get').mockReturnValue(null)

    printHtml('<p>текст</p>', 'Заметка')

    expect(document.querySelector('iframe')).toBeNull()
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
