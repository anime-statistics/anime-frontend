import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient } from '@/apis/http/client'
import { toApiRequestError } from '@/apis/http/errorHandler'
import { SYNC } from '@/core/constants/apiRoutes'
import type {
  ISyncChange,
  ISyncChangeDraft,
  ISyncResolution,
  ISyncState,
} from '@/types/sync'

export const useSyncStore = defineStore('sync', () => {
  const pendingChanges = ref<ISyncChange[]>([])
  const lastSyncAt = ref<string | null>(null)
  const state = ref<ISyncState>('idle')
  const errorMessage = ref<string | null>(null)

  const unresolvedChanges = computed(() =>
    pendingChanges.value.filter((change) => change.resolvedValue == null),
  )
  const resolvedChanges = computed(() =>
    pendingChanges.value.filter((change) => change.resolvedValue != null),
  )
  const unresolvedCount = computed(() => unresolvedChanges.value.length)
  const hasConflicts = computed(() => unresolvedCount.value > 0)

  function stageChange(change: ISyncChangeDraft): ISyncChange {
    const staged: ISyncChange = {
      ...change,
      id: crypto.randomUUID(),
      detectedAt: new Date().toISOString(),
      resolvedValue: null,
    }
    pendingChanges.value = [...pendingChanges.value, staged]
    state.value = 'conflict'
    return staged
  }

  function resolveConflict(changeId: string, choice: ISyncResolution): void {
    const change = pendingChanges.value.find((item) => item.id === changeId)
    if (!change) return

    change.resolvedValue = choice === 'local' ? change.localValue : change.remoteValue
    if (unresolvedCount.value === 0) state.value = 'idle'
  }

  function resolveAll(choice: ISyncResolution): void {
    for (const change of unresolvedChanges.value) {
      resolveConflict(change.id, choice)
    }
  }

  async function commitChanges(): Promise<void> {
    const resolved = resolvedChanges.value
    if (resolved.length === 0) return

    state.value = 'syncing'
    errorMessage.value = null

    try {
      await apiClient.post(`${SYNC}/commit`, {
        changes: resolved.map((change) => ({
          mediaId: change.mediaId,
          field: change.field,
          value: change.resolvedValue,
          source: change.source,
        })),
      })
      pendingChanges.value = pendingChanges.value.filter((change) => change.resolvedValue == null)
      lastSyncAt.value = new Date().toISOString()
      state.value = unresolvedCount.value > 0 ? 'conflict' : 'idle'
    } catch (error) {
      errorMessage.value = toApiRequestError(error).message
      state.value = 'error'
    }
  }

  function discardAll(): void {
    pendingChanges.value = []
    state.value = 'idle'
  }

  return {
    pendingChanges,
    lastSyncAt,
    state,
    errorMessage,
    unresolvedChanges,
    resolvedChanges,
    unresolvedCount,
    hasConflicts,
    stageChange,
    resolveConflict,
    resolveAll,
    commitChanges,
    discardAll,
  }
})
