import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { usePrefetchRoute } from '@/composables/usePrefetchRoute'

const stub = { template: '<div />' }

function createHarness(lazyDetail: () => Promise<unknown>): {
  prefetch: (routeName: string) => void
} {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: stub },
      { path: '/anime/:id', name: 'anime-detail', component: lazyDetail },
    ],
  })

  let result: { prefetch: (routeName: string) => void } | undefined

  mount(
    defineComponent({
      setup() {
        result = usePrefetchRoute()
        return () => null
      },
    }),
    { global: { plugins: [router] } },
  )

  if (!result) throw new Error('composable did not run')
  return result
}

describe('usePrefetchRoute', () => {
  it('invokes the lazy component loader once per route', () => {
    const loader = vi.fn(() => Promise.resolve(stub))
    const { prefetch } = createHarness(loader)

    prefetch('anime-detail')
    prefetch('anime-detail')

    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('ignores routes that are not lazily loaded', () => {
    const loader = vi.fn(() => Promise.resolve(stub))
    const { prefetch } = createHarness(loader)

    prefetch('home')

    expect(loader).not.toHaveBeenCalled()
  })

  it('ignores unknown route names', () => {
    const loader = vi.fn(() => Promise.resolve(stub))
    const { prefetch } = createHarness(loader)

    expect(() => prefetch('nope')).not.toThrow()
    expect(loader).not.toHaveBeenCalled()
  })
})
