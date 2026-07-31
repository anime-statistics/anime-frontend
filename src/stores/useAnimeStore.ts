import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { parseMediaId } from '@/core/utils/slugGenerator'
import type { IViewMode } from '@/types/settings'

function extractNumericId(mediaId: string): number | null {
  return parseMediaId(mediaId)?.id ?? null
}

export const useAnimeStore = defineStore('anime', () => {
  const selectedIds = ref<Set<string>>(new Set())
  const viewMode = ref<IViewMode>('cards')

  const selectedCount = computed(() => selectedIds.value.size)
  const hasSelection = computed(() => selectedIds.value.size > 0)

  function isSelected(id: string): boolean {
    return selectedIds.value.has(id)
  }

  function toggleSelection(id: string): void {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  function selectAll(ids: readonly string[]): void {
    selectedIds.value = new Set(ids)
  }

  function clearSelection(): void {
    selectedIds.value = new Set()
  }

  function setViewMode(mode: IViewMode): void {
    viewMode.value = mode
  }

  return {
    selectedIds,
    viewMode,
    selectedCount,
    hasSelection,
    extractNumericId,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    setViewMode,
  }
})
