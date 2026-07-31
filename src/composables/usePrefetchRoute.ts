import { useRouter } from 'vue-router'

type LazyComponent = () => Promise<unknown>

/**
 * Warms a lazily-imported route chunk before navigation. Hovering a card is a
 * strong signal the detail page is next, and the import cache makes repeat
 * calls free.
 */
export function usePrefetchRoute(): { prefetch: (routeName: string) => void } {
  const router = useRouter()
  const requested = new Set<string>()

  function prefetch(routeName: string): void {
    if (requested.has(routeName)) return
    requested.add(routeName)

    const record = router.getRoutes().find((route) => route.name === routeName)
    const component = record?.components?.default
    if (typeof component === 'function') void (component as LazyComponent)()
  }

  return { prefetch }
}
