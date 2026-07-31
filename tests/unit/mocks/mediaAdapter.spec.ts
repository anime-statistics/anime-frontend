import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/apis/http/client'
import { handlers, resetMockState } from '@/mocks/handlers'
import { mediaAdapter } from '@/mocks/mediaAdapter'
import { shikimoriAdapter } from '@/mocks/shikimori/shikimoriAdapter'
import { anilibertyAdapter } from '@/mocks/aniliberty/anilibertyAdapter'

const server = setupServer(...handlers)

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

    expect(items.length).toBeGreaterThan(0)
    expect(total).toBe(items.length)
    expect(items.every((item) => item.source === 'shikimori')).toBe(true)
  })

  it('converts the snake_case response back to camelCase', async () => {
    const { items } = await shikimoriAdapter.searchAnime('fullmetal')

    expect(items[0].episodesTotal).toBe(64)
    expect(items[0].titleEnglish).toBe('Fullmetal Alchemist: Brotherhood')
  })

  it('fetches details by slug id', async () => {
    const detail = await shikimoriAdapter.getAnimeById(
      'shikimori_5114-fullmetal-alchemist-brotherhood',
    )

    expect(detail.watchedEpisodes).toBe(64)
    expect(detail.externalLinks?.[0].url).toBe('https://shikimori.one/animes/5114')
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
      query: 'steins',
      sources: ['shikimori', 'aniliberty'],
    })

    expect(items).toHaveLength(1)
    expect(items[0].source).toBe('shikimori')
    expect(items[0].secondarySource).toBe('aniliberty')
  })

  it('merges entries whose titles differ but english titles match', async () => {
    const { items } = await mediaAdapter.search({
      query: 'titan',
      sources: ['shikimori', 'aniliberty'],
    })

    expect(items).toHaveLength(1)
    expect(items[0].titleEnglish).toBe('Attack on Titan')
    expect(items[0].secondarySource).toBe('aniliberty')
  })

  it('keeps unrelated titles separate', async () => {
    const { items } = await mediaAdapter.search({
      query: 'death note',
      sources: ['shikimori', 'aniliberty'],
    })

    expect(items).toHaveLength(1)
    expect(items[0].secondarySource).toBeUndefined()
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
  })
})

describe('mediaAdapter.getAnimeById', () => {
  it('routes to the source encoded in the media id', async () => {
    const detail = await mediaAdapter.getAnimeById('shikimori_9253-steins-gate')

    expect(detail.title).toBe('Steins;Gate')
  })

  it('rejects a malformed media id', async () => {
    await expect(mediaAdapter.getAnimeById('not-an-id')).rejects.toThrow('Invalid mediaId')
  })
})

describe('stateful mutations', () => {
  it('persists a status patch for the lifetime of the mock state', async () => {
    await apiClient.patch('/anime/shikimori_20-naruto/status', { status: 'completed' })

    const { items } = await shikimoriAdapter.searchAnime('naruto')

    expect(items[0].status).toBe('completed')
  })

  it('resets mutations between tests', async () => {
    const { items } = await shikimoriAdapter.searchAnime('naruto')

    expect(items[0].status).toBe('rewatching')
  })

  it('applies a bulk patch to several ids', async () => {
    const { data } = await apiClient.post<{ updated: number }>('/anime/bulk', {
      ids: ['shikimori_20-naruto', 'shikimori_21-one-piece'],
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
      params: { mediaId: 'shikimori_9253-steins-gate' },
    })

    expect(data.items).toHaveLength(1)
    expect(data.items[0].mediaId).toBe('shikimori_9253-steins-gate')
  })

  it('searches manga through the facade', async () => {
    const { items } = await mediaAdapter.searchManga({
      query: 'berserk',
      sources: ['shikimori', 'aniliberty'],
    })

    expect(items).toHaveLength(1)
    expect(items[0].chaptersTotal).toBe(375)
  })
})
