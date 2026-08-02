import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/apis/http/client'
import { mediaApi } from '@/apis/mediaApi'
import { SEEDED_TAG_IDS } from '@/core/constants/seededTags'
import { animeSearchResults } from '@/mocks/fixtures/animeData'
import { mangaSearchResults } from '@/mocks/fixtures/mangaData'
import { handlers, resetMockState } from '@/mocks/handlers'

const server = setupServer(...handlers)

// The fixtures are generated from a real Shikimori list, so the tests anchor on
// entries looked up by shape rather than on hard-coded titles.
const shikimoriItems = animeSearchResults.filter((item) => item.source === 'shikimori')
const anilibertyItems = animeSearchResults.filter((item) => item.source === 'aniliberty')
const collectionItems = animeSearchResults.filter((item) => item.myTags.length > 0)

function slugOf(mediaId: string): string {
  return mediaId.split('-').slice(1).join('-')
}

const anilibertySlugs = new Set(anilibertyItems.map((item) => slugOf(item.id)))
const pairedItem = shikimoriItems.find((item) => anilibertySlugs.has(slugOf(item.id)))!
const soloItem = shikimoriItems.find(
  (item) =>
    !anilibertySlugs.has(slugOf(item.id))
    && item.titleEnglish !== undefined
    && item.myTags.length > 0,
)!
const catalogueOnlyItem = shikimoriItems.find((item) => item.myTags.length === 0)!

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://localhost:3000/api/v1/'
  apiClient.defaults.adapter = 'fetch'
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  resetMockState()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('mediaApi.searchAnime', () => {
  it('merges cross-source duplicates into a single card', async () => {
    const { items } = await mediaApi.searchAnime({ query: pairedItem.title })

    const merged = items.find((item) => item.id === pairedItem.id)
    expect(merged?.source).toBe('shikimori')
    expect(merged?.secondarySource).toBe('aniliberty')
  })

  it('keeps unrelated titles separate', async () => {
    const { items } = await mediaApi.searchAnime({ query: soloItem.title })

    expect(items.find((item) => item.id === soloItem.id)?.secondarySource).toBeUndefined()
  })

  it('narrows to a single source when asked', async () => {
    const { items } = await mediaApi.searchAnime({ query: '', sources: ['aniliberty'] })

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.source === 'aniliberty')).toBe(true)
  })

  it('searches the whole catalogue, not just the collection', async () => {
    const { items } = await mediaApi.searchAnime({ query: catalogueOnlyItem.title })

    const found = items.find((item) => item.id === catalogueOnlyItem.id)
    expect(found).toBeDefined()
    expect(found?.myTags).toEqual([])
  })

  it('matches on the russian title', async () => {
    const withRussian = shikimoriItems.find((item) => item.titleRussian)!
    const { items } = await mediaApi.searchAnime({ query: withRussian.titleRussian! })

    expect(items.some((item) => item.id === withRussian.id)).toBe(true)
  })

  it('reports total as the deduplicated length', async () => {
    const { items, total } = await mediaApi.searchAnime({ query: '' })

    expect(total).toBe(items.length)
    expect(items.length).toBeLessThan(animeSearchResults.length)
  })
})

describe('mediaApi.getAnimeLibrary', () => {
  it('returns the whole collection, not just the first page', async () => {
    const { items, total } = await mediaApi.getAnimeLibrary()

    expect(total).toBe(collectionItems.length)
    expect(items).toHaveLength(collectionItems.length)
  })

  it('leaves untagged titles out of the collection', async () => {
    const { items } = await mediaApi.getAnimeLibrary()

    expect(items.every((item) => item.myTags.length > 0)).toBe(true)
    expect(items.some((item) => item.id === catalogueOnlyItem.id)).toBe(false)
  })

  it('narrows to a single tag', async () => {
    const { items } = await mediaApi.getAnimeLibrary({ tag: SEEDED_TAG_IDS.completed })

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.myTags.includes(SEEDED_TAG_IDS.completed))).toBe(true)
  })
})

describe('mediaApi.getAnimeById', () => {
  it('loads details and both halves of the external link', async () => {
    const detail = await mediaApi.getAnimeById(soloItem.id)
    const numericId = soloItem.id.split('_')[1].split('-')[0]

    expect(detail.title).toBe(soloItem.title)
    expect(detail.externalLinks?.[0].url).toBe(`https://shikimori.one/animes/${numericId}`)
    expect(detail.externalLinks?.[0].apiUrl).toBe(`https://shikimori.one/api/animes/${numericId}`)
  })

  it('rejects a malformed media id', async () => {
    await expect(mediaApi.getAnimeById('not-an-id')).rejects.toThrow('Invalid mediaId')
  })
})

describe('stateful mutations', () => {
  it('persists a progress patch for the lifetime of the mock state', async () => {
    await mediaApi.updateAnimeProgress(soloItem.id, { score: 3 })

    const detail = await mediaApi.getAnimeById(soloItem.id)
    expect(detail.score).toBe(3)
  })

  it('resets mutations between tests', async () => {
    const detail = await mediaApi.getAnimeById(soloItem.id)

    expect(detail.score).toBe(soloItem.score)
  })

  it('adds a catalogue title to the collection when it is tagged', async () => {
    await mediaApi.updateAnimeTags(catalogueOnlyItem.id, [SEEDED_TAG_IDS.planned])

    const { items } = await mediaApi.getAnimeLibrary()
    expect(items.some((item) => item.id === catalogueOnlyItem.id)).toBe(true)
  })

  it('adds and removes tags in bulk without touching the others', async () => {
    const ids = [soloItem.id, pairedItem.id]
    const added = await mediaApi.bulkUpdateAnimeTags({ ids, add: [SEEDED_TAG_IDS.rewatching] })
    expect(added).toBe(2)

    const tagged = await mediaApi.getAnimeById(soloItem.id)
    expect(tagged.myTags).toContain(SEEDED_TAG_IDS.rewatching)
    for (const tagId of soloItem.myTags) expect(tagged.myTags).toContain(tagId)

    await mediaApi.bulkUpdateAnimeTags({ ids, remove: [SEEDED_TAG_IDS.rewatching] })
    const untagged = await mediaApi.getAnimeById(soloItem.id)
    expect(untagged.myTags).toEqual(soloItem.myTags)
  })

  it('clears every tag to drop titles out of the collection', async () => {
    await mediaApi.bulkUpdateAnimeTags({ ids: [soloItem.id], clear: true })

    const { items } = await mediaApi.getAnimeLibrary()
    expect(items.some((item) => item.id === soloItem.id)).toBe(false)
  })

  it('untags a single title to drop it out of the collection', async () => {
    await mediaApi.updateAnimeTags(soloItem.id, [])

    const { items } = await mediaApi.getAnimeLibrary()
    expect(items.some((item) => item.id === soloItem.id)).toBe(false)
  })

  // A source the importer missed can be pointed at by hand; the edited pair
  // then replaces whatever the detail used to carry.
  it('replaces the external links with the edited pair', async () => {
    const links = [
      {
        source: 'aniliberty',
        url: 'https://aniliberty.top/anime/frieren',
        apiUrl: 'https://aniliberty.top/api/anime/frieren',
      },
    ]
    await mediaApi.updateAnimeLinks(soloItem.id, links)

    const detail = await mediaApi.getAnimeById(soloItem.id)
    expect(detail.externalLinks).toEqual(links)
  })

  it('edits the manga links through the same route', async () => {
    const target = mangaSearchResults[0]
    const links = [
      {
        source: 'shikimori',
        url: 'https://shikimori.one/mangas/1',
        apiUrl: 'https://shikimori.one/api/mangas/1',
      },
    ]
    await mediaApi.updateMangaLinks(target.id, links)

    const detail = await mediaApi.getMangaById(target.id)
    expect(detail.externalLinks).toEqual(links)
  })
})

describe('mock tags and notes', () => {
  it('lists the seeded tags first', async () => {
    const { data } = await apiClient.get<{ items: { id: string }[] }>('/tags')

    expect(data.items[0].id).toBe(SEEDED_TAG_IDS.watching)
    expect(data.items.map((tag) => tag.id).slice(0, 6)).toEqual(Object.values(SEEDED_TAG_IDS))
  })

  it('creates and deletes a tag', async () => {
    const { data: created, status } = await apiClient.post<{ id: string, name: string }>('/tags', {
      name: 'Новый',
      color: '#123456',
      sortOrder: 99,
    })

    expect(status).toBe(201)
    expect(created.name).toBe('Новый')

    const deleted = await apiClient.delete(`/tags/${created.id}`)
    expect(deleted.status).toBe(204)
  })

  // Every tag is equal now, seeded ones included.
  it('deletes a seeded tag like any other', async () => {
    const deleted = await apiClient.delete(`/tags/${SEEDED_TAG_IDS.watching}`)

    expect(deleted.status).toBe(204)
  })

  it('filters notes by media id', async () => {
    const { data } = await apiClient.get<{ items: { mediaId: string }[] }>('/notes', {
      params: { mediaId: 'shikimori_52991-sousou-no-frieren' },
    })

    expect(data.items).toHaveLength(1)
    expect(data.items[0].mediaId).toBe('shikimori_52991-sousou-no-frieren')
  })
})

describe('manga through the same facade', () => {
  it('searches the catalogue', async () => {
    const target = mangaSearchResults[0]
    const { items } = await mediaApi.searchManga({ query: target.title })

    expect(items.some((item) => item.id === target.id)).toBe(true)
  })

  it('keeps the library to the collection', async () => {
    const { items } = await mediaApi.getMangaLibrary()

    expect(items.every((item) => item.myTags.length > 0)).toBe(true)
    expect(items.length).toBeLessThan(mangaSearchResults.length)
  })
})
