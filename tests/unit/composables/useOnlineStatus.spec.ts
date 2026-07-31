import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, type Ref } from 'vue'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

function mountStatus(): { isOnline: Ref<boolean>, unmount: () => void } {
  let result: { isOnline: Ref<boolean> } | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useOnlineStatus()
        return () => null
      },
    }),
  )

  if (!result) throw new Error('composable did not run')
  return { isOnline: result.isOnline, unmount: () => wrapper.unmount() }
}

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})

describe('useOnlineStatus', () => {
  it('starts from navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })

    const { isOnline, unmount } = mountStatus()

    expect(isOnline.value).toBe(false)
    unmount()
  })

  it('follows the offline and online events', () => {
    const { isOnline, unmount } = mountStatus()
    expect(isOnline.value).toBe(true)

    window.dispatchEvent(new Event('offline'))
    expect(isOnline.value).toBe(false)

    window.dispatchEvent(new Event('online'))
    expect(isOnline.value).toBe(true)

    unmount()
  })

  it('stops listening once the scope is disposed', () => {
    const { isOnline, unmount } = mountStatus()
    unmount()

    window.dispatchEvent(new Event('offline'))

    expect(isOnline.value).toBe(true)
  })
})
