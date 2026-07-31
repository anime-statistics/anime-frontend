import { describe, expect, it } from 'vitest'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { DETAIL_ROUTE_NAMES, router } from '@/router'

function normalise(path: string): RouteLocationNormalizedLoaded {
  const resolved = router.resolve(path)
  return { ...resolved, name: resolved.name ?? undefined }
}

describe('router configuration', () => {
  it('registers every top-level page', () => {
    const names = router.getRoutes().map((route) => route.name)

    expect(names).toEqual(
      expect.arrayContaining([
        'home',
        'anime-detail',
        'manga-detail',
        'search',
        'tags',
        'settings',
        'not-found',
      ]),
    )
  })

  it('lazy-loads every view', () => {
    const eager = router
      .getRoutes()
      .filter((route) => typeof route.components?.default !== 'function')

    expect(eager).toEqual([])
  })

  it('resolves detail routes with an id param', () => {
    const resolved = router.resolve('/anime/shikimori_9253-steins-gate')

    expect(resolved.name).toBe('anime-detail')
    expect(resolved.params.id).toBe('shikimori_9253-steins-gate')
  })

  it('passes route params as props on detail routes', () => {
    for (const name of DETAIL_ROUTE_NAMES) {
      const record = router.getRoutes().find((route) => route.name === name)
      expect(record?.props.default).toBe(true)
    }
  })

  it('falls back to not-found for unknown paths', () => {
    expect(router.resolve('/nope/deeper').name).toBe('not-found')
  })

  it('scrolls to the top on navigation', () => {
    const to = normalise('/tags')
    const from = normalise('/')

    expect(router.options.scrollBehavior?.(to, from, null)).toEqual({ top: 0 })
  })
})
