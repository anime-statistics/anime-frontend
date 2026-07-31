import type { MediaSource } from '@/core/utils/slugGenerator'

export type ISyncField = 'status' | 'score' | 'episodes' | 'volumes' | 'chapters'

export type ISyncState = 'idle' | 'syncing' | 'conflict' | 'error'

export type ISyncResolution = 'local' | 'remote' | 'both'

export interface ISyncChange {
  id: string
  mediaId: string
  field: ISyncField
  localValue: unknown
  remoteValue: unknown
  resolvedValue: unknown
  source: MediaSource
  detectedAt: string
}

export type ISyncChangeDraft = Omit<ISyncChange, 'id' | 'detectedAt' | 'resolvedValue'>

export interface ISyncStatus {
  state: ISyncState
  pendingChanges: number
  lastSyncedAt?: string
  errorMessage?: string
}
