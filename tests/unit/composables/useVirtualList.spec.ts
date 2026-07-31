import { mount } from '@vue/test-utils'
import { computed, defineComponent, ref, type Ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useVirtualList, VIRTUAL_ROW_HEIGHT } from '@/composables/useVirtualList'

function mountVirtualList(count: Ref<number>, rowHeight?: number) {
  const scrollElement = ref<HTMLElement | null>(null)
  let api: ReturnType<typeof useVirtualList> | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        api = useVirtualList(computed(() => count.value), scrollElement, rowHeight)
        return () => null
      },
    }),
  )

  if (!api) throw new Error('composable did not run')
  return { api, wrapper }
}

describe('useVirtualList', () => {
  it('reports a total height derived from the row estimate', () => {
    const { api, wrapper } = mountVirtualList(ref(1000))

    expect(api.totalHeight.value).toBe(1000 * VIRTUAL_ROW_HEIGHT)
    wrapper.unmount()
  })

  it('honours a custom row height', () => {
    const { api, wrapper } = mountVirtualList(ref(10), 100)

    expect(api.totalHeight.value).toBe(1000)
    wrapper.unmount()
  })

  it('renders far fewer rows than the list holds', () => {
    const { api, wrapper } = mountVirtualList(ref(5000))

    expect(api.virtualRows.value.length).toBeLessThan(5000)
    wrapper.unmount()
  })

  it('reacts to the count changing', async () => {
    const count = ref(10)
    const { api, wrapper } = mountVirtualList(count)

    count.value = 40
    await wrapper.vm.$nextTick()

    expect(api.totalHeight.value).toBe(40 * VIRTUAL_ROW_HEIGHT)
    wrapper.unmount()
  })

  it('handles an empty list', () => {
    const { api, wrapper } = mountVirtualList(ref(0))

    expect(api.totalHeight.value).toBe(0)
    expect(api.virtualRows.value).toEqual([])
    wrapper.unmount()
  })
})
