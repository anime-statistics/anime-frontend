import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'

export interface IInfinitePage<T> {
  items: T[]
  hasMore: boolean
}

export function useInfiniteScroll<T>(
  fetchPage: (page: number) => Promise<IInfinitePage<T>>,
): {
  items: Ref<T[]>
  page: Ref<number>
  hasMore: Ref<boolean>
  isLoading: Ref<boolean>
  sentinel: Ref<HTMLElement | null>
  loadMore: () => Promise<void>
  reset: () => Promise<void>
} {
  const items = ref<T[]>([]) as Ref<T[]>
  const page = ref(0)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const sentinel = ref<HTMLElement | null>(null)

  let observer: IntersectionObserver | null = null
  // Guards loadMore results against a reset() that happened mid-flight.
  let generation = 0

  async function loadMore(): Promise<void> {
    if (isLoading.value || !hasMore.value) return

    const currentGeneration = generation
    isLoading.value = true

    try {
      const result = await fetchPage(page.value + 1)
      if (currentGeneration !== generation) return

      items.value = [...items.value, ...result.items]
      page.value += 1
      hasMore.value = result.hasMore
    } finally {
      if (currentGeneration === generation) isLoading.value = false
    }
  }

  async function reset(): Promise<void> {
    generation += 1
    items.value = []
    page.value = 0
    hasMore.value = true
    isLoading.value = false
    await loadMore()
  }

  function observe(element: HTMLElement | null): void {
    observer?.disconnect()
    if (!element || typeof IntersectionObserver === 'undefined') return

    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore()
    }, { rootMargin: '200px' })
    observer.observe(element)
  }

  watch(sentinel, observe)

  if (getCurrentScope()) {
    onScopeDispose(() => observer?.disconnect())
  }

  return { items, page, hasMore, isLoading, sentinel, loadMore, reset }
}
