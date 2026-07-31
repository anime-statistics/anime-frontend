export type ISyncEntity = 'anime' | 'manga' | 'tag' | 'note' | 'settings'

export type ISyncOperation = 'create' | 'update' | 'delete'

export type ISyncState = 'idle' | 'syncing' | 'conflict' | 'error'

export interface ISyncChange {
  id: string
  entity: ISyncEntity
  entityId: string
  operation: ISyncOperation
  payload: unknown
  createdAt: string
}

export interface ISyncStatus {
  state: ISyncState
  pendingChanges: number
  lastSyncedAt?: string
  errorMessage?: string
}
