import { mount, type VueWrapper } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import { i18n } from '@/core/i18n'

const Exploding = defineComponent({
  props: { shouldThrow: { type: Boolean, default: true } },
  setup(props) {
    return () => {
      if (props.shouldThrow) throw new Error('render exploded')
      return h('p', 'recovered')
    }
  },
})

function mountBoundary(shouldThrow: Ref<boolean> = ref(true)): VueWrapper {
  return mount(ErrorBoundary, {
    slots: { default: () => h(Exploding, { shouldThrow: shouldThrow.value }) },
    global: { plugins: [i18n] },
  })
}

describe('ErrorBoundary', () => {
  it('renders the slot while nothing throws', () => {
    const wrapper = mountBoundary(ref(false))

    expect(wrapper.text()).toContain('recovered')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows the fallback with the error message when a child throws', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountBoundary()
    await nextTick()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('render exploded')
  })

  it('clears the error when retry is pressed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const shouldThrow = ref(true)
    const wrapper = mountBoundary(shouldThrow)
    await nextTick()

    shouldThrow.value = false
    await wrapper.find('[role="alert"] button').trigger('click')

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('recovered')
  })
})
