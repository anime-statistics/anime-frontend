import { computed, ref, type ComputedRef, type Ref } from 'vue'

export const PULL_THRESHOLD_PX = 80

const RESISTANCE = 0.5
const MAX_PULL_PX = 120

export function usePullToRefresh(refreshFn: () => Promise<void>): {
  isPulling: Ref<boolean>
  isRefreshing: Ref<boolean>
  pullDistance: Ref<number>
  progress: ComputedRef<number>
  onTouchStart: (event: TouchEvent) => void
  onTouchMove: (event: TouchEvent) => void
  onTouchEnd: () => void
} {
  const isPulling = ref(false)
  const isRefreshing = ref(false)
  const pullDistance = ref(0)

  let startY: number | null = null

  const progress = computed(() => Math.min(1, pullDistance.value / PULL_THRESHOLD_PX))

  function onTouchStart(event: TouchEvent): void {
    // Only a pull that begins at the very top of the document counts; anywhere
    // else the gesture belongs to normal scrolling.
    if (isRefreshing.value || window.scrollY > 0) return
    startY = event.touches[0]?.clientY ?? null
  }

  function onTouchMove(event: TouchEvent): void {
    if (startY === null) return

    const currentY = event.touches[0]?.clientY ?? startY
    const delta = (currentY - startY) * RESISTANCE

    if (delta <= 0) {
      isPulling.value = false
      pullDistance.value = 0
      return
    }

    isPulling.value = true
    pullDistance.value = Math.min(MAX_PULL_PX, delta)
  }

  function onTouchEnd(): void {
    const reachedThreshold = pullDistance.value >= PULL_THRESHOLD_PX
    startY = null
    isPulling.value = false

    if (!reachedThreshold) {
      pullDistance.value = 0
      return
    }

    isRefreshing.value = true
    // A failed refresh must still release the indicator; the query layer owns
    // surfacing the error.
    void refreshFn()
      .catch(() => undefined)
      .finally(() => {
        isRefreshing.value = false
        pullDistance.value = 0
      })
  }

  return { isPulling, isRefreshing, pullDistance, progress, onTouchStart, onTouchMove, onTouchEnd }
}
