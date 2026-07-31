import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
}

/**
 * Runs a composable inside a mounted component so that TanStack Query's
 * injection and Vue's lifecycle hooks behave exactly as they do in the app.
 */
export function withQueryClient<T>(
  composable: () => T,
  queryClient = createTestQueryClient(),
): { result: T, wrapper: VueWrapper, queryClient: QueryClient } {
  let result: T | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => null
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  )

  if (result === undefined) throw new Error('composable did not run')
  return { result, wrapper, queryClient }
}
