import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/apis/http/client'
import { handlers, resetMockState } from '@/mocks/handlers'
import { useTagStore } from '@/stores/useTagStore'

const server = setupServer(...handlers)

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://localhost:3000/api/v1/'
  apiClient.defaults.adapter = 'fetch'
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  setActivePinia(createPinia())
  resetMockState()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('useTagStore.fetchTags', () => {
  it('loads and validates tags', async () => {
    const store = useTagStore()

    await store.fetchTags()

    expect(store.tags.length).toBeGreaterThan(0)
    expect(store.isLoading).toBe(false)
    expect(store.errorMessage).toBeNull()
  })

  it('splits tags into visible and hidden', async () => {
    const store = useTagStore()

    await store.fetchTags()

    expect(store.hiddenTagIds.length).toBe(1)
    expect(store.visibleTags.length).toBe(store.tags.length - 1)
    expect(store.visibleTags.every((tag) => !tag.isHidden)).toBe(true)
  })
})

describe('useTagStore.toggleTagVisibility', () => {
  it('hides a visible tag', async () => {
    const store = useTagStore()
    await store.fetchTags()
    const target = store.visibleTags[0]

    await store.toggleTagVisibility(target.id)

    expect(store.findTag(target.id)?.isHidden).toBe(true)
    expect(store.hiddenTagIds).toContain(target.id)
  })

  it('reveals a hidden tag', async () => {
    const store = useTagStore()
    await store.fetchTags()
    const hiddenId = store.hiddenTagIds[0]

    await store.toggleTagVisibility(hiddenId)

    expect(store.findTag(hiddenId)?.isHidden).toBe(false)
    expect(store.hiddenTagIds).not.toContain(hiddenId)
  })

  it('does nothing for an unknown id', async () => {
    const store = useTagStore()
    await store.fetchTags()
    const before = store.tags.length

    await store.toggleTagVisibility('missing')

    expect(store.tags).toHaveLength(before)
    expect(store.errorMessage).toBeNull()
  })
})

describe('useTagStore CRUD', () => {
  it('creates a tag and appends it to the list', async () => {
    const store = useTagStore()
    await store.fetchTags()
    const before = store.tags.length

    const created = await store.createTag({
      name: 'Ретро',
      color: '#a16207',
      isHidden: false,
      sortOrder: 99,
    })

    expect(created?.name).toBe('Ретро')
    expect(store.tags).toHaveLength(before + 1)
  })

  it('updates a tag in place', async () => {
    const store = useTagStore()
    await store.fetchTags()
    const target = store.tags[0]

    await store.updateTag(target.id, { name: 'Избранное' })

    expect(store.findTag(target.id)?.name).toBe('Избранное')
  })

  it('deletes a custom tag', async () => {
    const store = useTagStore()
    await store.fetchTags()
    const target = store.customTags[0]

    await store.deleteTag(target.id)

    expect(store.findTag(target.id)).toBeUndefined()
  })

  // The seeded watch statuses stay put so the vocabulary can never empty out.
  it('refuses to delete a system tag', async () => {
    const store = useTagStore()
    await store.fetchTags()
    const target = store.systemTags[0]

    await store.deleteTag(target.id)

    expect(store.findTag(target.id)).toBeDefined()
  })

  it('records an error message when the request fails', async () => {
    const store = useTagStore()
    await store.fetchTags()

    await store.updateTag('0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5ffff', { name: 'X' })

    expect(store.errorMessage).not.toBeNull()
    expect(store.isLoading).toBe(false)
  })
})

describe('useTagStore.reorderTags', () => {
  it('writes the new index into sortOrder', async () => {
    const store = useTagStore()
    await store.fetchTags()
    const reversed = store.tags.map((tag) => tag.id).toReversed()

    await store.reorderTags(reversed)

    expect(reversed.map((id) => store.findTag(id)?.sortOrder)).toEqual(
      reversed.map((_id, index) => index),
    )
  })
})
