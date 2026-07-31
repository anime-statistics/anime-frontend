import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual'
import { computed, type ComputedRef, type Ref } from 'vue'

export const VIRTUAL_ROW_HEIGHT = 48

export function useVirtualList(
  count: Ref<number> | ComputedRef<number>,
  scrollElement: Ref<HTMLElement | null>,
  rowHeight = VIRTUAL_ROW_HEIGHT,
): {
  virtualRows: ComputedRef<VirtualItem[]>
  totalHeight: ComputedRef<number>
} {
  const virtualizer = useVirtualizer(
    computed(() => ({
      count: count.value,
      getScrollElement: () => scrollElement.value,
      estimateSize: () => rowHeight,
      overscan: 8,
    })),
  )

  return {
    virtualRows: computed(() => virtualizer.value.getVirtualItems()),
    totalHeight: computed(() => virtualizer.value.getTotalSize()),
  }
}
