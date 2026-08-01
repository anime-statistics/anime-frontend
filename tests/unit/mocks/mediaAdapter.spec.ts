import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/apis/http/client'
import { animeSearchResults } from '@/mocks/fixtures/animeData'
import { mangaSearchResults } from '@/mocks/fixtures/mangaData'
import { handlers, resetMockState } from '@/mocks/handlers'
import { mediaAdapter } from '@/mocks/mediaAdapter'
import { shikimoriAdapter } from '@/mocks/shikimori/shikimoriAdapter'
import { anilibertyAdapter } from '@/mocks/aniliberty/anilibertyAdapter'

const server = setupServer(...handlers)

// The fixtures are generated from a real Shikimori list, so the tests anchor on
// entries looked up by shape rather than on hard-coded titles.
const shikimoriItems = animeSearchResults.filter((item) => item.source === 'shikimori')
const anilibertyItems = animeSearchResults.filter((item) => item.source === 'aniliberty')

function slugOf(mediaId: string): string {
  return mediaId.split('-').slice(1).join('-')
}

const anilibertySlugs = new Set(anilibertyItems.map((item) => slugOf(item.id)))
const pairedItem = shikimoriItems.find((item) => anilibertySlugs.has(slugOf(item.id)))!
const soloItem = shikimoriItems.find(
  (item) => !anilibertySlugs.has(slugOf(item.id)) && item.titleEnglish !== undefined,
)!

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

describe('shikimoriAdapter', () => {
  it('returns only shikimori anime and validates the DTOs', async () => {
    const { items, total } = await shikimoriAdapter.searchAnime('')

    // The endpoint pages at twenty; total reports the whole filtered set.
    expect(total).toBe(shikimoriItems.length)
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.source === 'shikimori')).toBe(true)
  })

  it('converts the snake_case response back to camelCase', async () => {
    const { items } = await shikimoriAdapter.searchAnime(soloItem.title)
    const found = items.find((item) => item.id === soloItem.id)

    expect(found?.episodesTotal).toBe(soloItem.episodesTotal)
    expect(found?.titleEnglish).toBe(soloItem.titleEnglish)
  })

  it('fetches details by slug id', async () => {
    const detail = await shikimoriAdapter.getAnimeById(soloItem.id)
    const numericId = soloItem.id.split('_')[1].split('-')[0]

    expect(detail.title).toBe(soloItem.title)
    expect(detail.externalLinks?.[0].url).toBe(`https://shikimori.one/animes/${numericId}`)
  })
})

describe('anilibertyAdapter', () => {
  it('returns only aniliberty anime', async () => {
    const { items } = await anilibertyAdapter.searchAnime('')

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.source === 'aniliberty')).toBe(true)
  })
})

describe('mediaAdapter.search', () => {
  it('merges cross-source duplicates into a single card', async () => {
    const { items } = await mediaAdapter.search({
      query: pairedItem.title,
      sources: ['shikimori', 'aniliberty'],
    })

    const merged = items.find((item) => item.id === pairedItem.id)
    expect(merged?.source).toBe('shikimori')
    expect(merged?.secondarySource).toBe('aniliberty')
  })

  it('keeps unrelated titles separate', async () => {
    const { items } = await mediaAdapter.search({
      query: soloItem.title,
      sources: ['shikimori', 'aniliberty'],
    })

    const found = items.find((item) => item.id === soloItem.id)
    expect(found?.secondarySource).toBeUndefined()
  })

  it('queries a single source when only one is requested', async () => {
    const { items } = await mediaAdapter.search({ query: '', sources: ['aniliberty'] })

    expect(items.every((item) => item.source === 'aniliberty')).toBe(true)
  })

  it('reports total as the deduplicated length', async () => {
    const { items, total } = await mediaAdapter.search({
      query: '',
      sources: ['shikimori', 'aniliberty'],
    })

    expect(total).toBe(items.length)
    expect(items.length).toBeLessThan(animeSearchResults.length)
  })
})

describe('mediaAdapter.getAnimeById', () => {
  it('routes to the source encoded in the media id', async () => {
    const detail = await mediaAdapter.getAnimeById(soloItem.id)

    expect(detail.title).toBe(soloItem.title)
  })

  it('rejects a malformed media id', async () => {
    await expect(mediaAdapter.getAnimeById('not-an-id')).rejects.toThrow('Invalid mediaId')
  })
})

describe('stateful mutations', () => {
  it('persists a status patch for the lifetime of the mock state', async () => {
    await apiClient.patch(`/anime/${soloItem.id}/status`, { status: 'completed' })

    const { items } = await shikimoriAdapter.searchAnime(soloItem.title)

    expect(items.find((item) => item.id === soloItem.id)?.status).toBe('completed')
  })

  it('resets mutations between tests', async () => {
    const { items } = await shikimoriAdapter.searchAnime(soloItem.title)

    expect(items.find((item) => item.id === soloItem.id)?.status).toBe(soloItem.status)
  })

  it('applies a bulk patch to several ids', async () => {
    const { data } = await apiClient.post<{ updated: number }>('/anime/bulk', {
      ids: [shikimoriItems[0].id, shikimoriItems[1].id],
      patch: { status: 'dropped' },
    })

    expect(data.updated).toBe(2)
  })
})

describe('mock manga, tags and notes', () => {
  it('lists tags sorted by sortOrder', async () => {
    const { data } = await apiClient.get<{ items: { name: string, sortOrder: number }[] }>('/tags')

    expect(data.items[0].name).toBe('Любимое')
    expect(data.items.map((tag) => tag.sortOrder)).toEqual(
      data.items.map((tag) => tag.sortOrder).toSorted((a, b) => a - b),
    )
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

  it('filters notes by media id', async () => {
    const { data } = await apiClient.get<{ items: { mediaId: string }[] }>('/notes', {
      params: { mediaId: 'shikimori_52991-sousou-no-frieren' },
    })

    expect(data.items).toHaveLength(1)
    expect(data.items[0].mediaId).toBe('shikimori_52991-sousou-no-frieren')
  })

  it('searches manga through the facade', async () => {
    const target = mangaSearchResults[0]
    const { items } = await mediaAdapter.searchManga({
      query: target.title,
      sources: ['shikimori', 'aniliberty'],
    })

    expect(items.some((item) => item.id === target.id)).toBe(true)
  })
})
