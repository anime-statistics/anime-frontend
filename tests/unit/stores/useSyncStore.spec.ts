import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/apis/http/client'
import { handlers, resetMockState } from '@/mocks/handlers'
import { useSyncStore } from '@/stores/useSyncStore'
import type { ISyncChangeDraft } from '@/types/sync'

const server = setupServer(...handlers)

const statusConflict: ISyncChangeDraft = {
  mediaId: 'shikimori_20-naruto',
  field: 'status',
  localValue: 'rewatching',
  remoteValue: 'completed',
  source: 'shikimori',
}

const scoreConflict: ISyncChangeDraft = {
  mediaId: 'shikimori_21-one-piece',
  field: 'score',
  localValue: 8,
  remoteValue: 9,
  source: 'shikimori',
}

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

describe('useSyncStore.stageChange', () => {
  it('stages a change as unresolved', () => {
    const store = useSyncStore()

    const staged = store.stageChange(statusConflict)

    expect(staged.resolvedValue).toBeNull()
    expect(staged.id).toBeTruthy()
    expect(store.unresolvedCount).toBe(1)
    expect(store.hasConflicts).toBe(true)
    expect(store.state).toBe('conflict')
  })

  it('timestamps the detection', () => {
    const store = useSyncStore()

    const staged = store.stageChange(statusConflict)

    expect(Number.isNaN(Date.parse(staged.detectedAt))).toBe(false)
  })
})

describe('useSyncStore.resolveConflict', () => {
  it('keeps the local value', () => {
    const store = useSyncStore()
    const staged = store.stageChange(statusConflict)

    store.resolveConflict(staged.id, 'local')

    expect(store.pendingChanges[0].resolvedValue).toBe('rewatching')
    expect(store.unresolvedCount).toBe(0)
    expect(store.state).toBe('idle')
  })

  it('accepts the remote value', () => {
    const store = useSyncStore()
    const staged = store.stageChange(statusConflict)

    store.resolveConflict(staged.id, 'remote')

    expect(store.pendingChanges[0].resolvedValue).toBe('completed')
  })

  it('prefers the remote value when merging both', () => {
    const store = useSyncStore()
    const staged = store.stageChange(statusConflict)

    store.resolveConflict(staged.id, 'both')

    expect(store.pendingChanges[0].resolvedValue).toBe('completed')
  })

  it('ignores an unknown change id', () => {
    const store = useSyncStore()
    store.stageChange(statusConflict)

    store.resolveConflict('missing', 'remote')

    expect(store.unresolvedCount).toBe(1)
  })

  it('resolves every pending change at once', () => {
    const store = useSyncStore()
    store.stageChange(statusConflict)
    store.stageChange(scoreConflict)

    store.resolveAll('remote')

    expect(store.unresolvedCount).toBe(0)
    expect(store.resolvedChanges.map((change) => change.resolvedValue)).toEqual(['completed', 9])
  })
})

describe('useSyncStore.commitChanges', () => {
  it('sends resolved changes and clears them', async () => {
    const store = useSyncStore()
    const staged = store.stageChange(statusConflict)
    store.resolveConflict(staged.id, 'remote')

    await store.commitChanges()

    expect(store.pendingChanges).toHaveLength(0)
    expect(store.lastSyncAt).not.toBeNull()
    expect(store.state).toBe('idle')
  })

  it('leaves unresolved changes staged', async () => {
    const store = useSyncStore()
    const resolved = store.stageChange(statusConflict)
    store.stageChange(scoreConflict)
    store.resolveConflict(resolved.id, 'local')

    await store.commitChanges()

    expect(store.pendingChanges).toHaveLength(1)
    expect(store.state).toBe('conflict')
  })

  it('does nothing when nothing is resolved', async () => {
    const store = useSyncStore()
    store.stageChange(statusConflict)

    await store.commitChanges()

    expect(store.lastSyncAt).toBeNull()
    expect(store.pendingChanges).toHaveLength(1)
  })
})

describe('useSyncStore.discardAll', () => {
  it('drops every staged change', () => {
    const store = useSyncStore()
    store.stageChange(statusConflict)
    store.stageChange(scoreConflict)

    store.discardAll()

    expect(store.pendingChanges).toHaveLength(0)
    expect(store.state).toBe('idle')
  })
})
