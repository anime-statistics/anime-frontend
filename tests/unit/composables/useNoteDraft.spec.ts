import { mount } from '@vue/test-utils'
import { defineComponent, ref, type Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNoteDraft } from '@/composables/useNoteDraft'

interface IDraftApi {
  read: () => string | null
  write: (content: string) => void
  discard: () => void
}

function mountDraft(key: Ref<string>, isDirty: Ref<boolean>) {
  let api: IDraftApi | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        api = useNoteDraft(key, isDirty)
        return () => null
      },
    }),
  )

  if (!api) throw new Error('composable did not run')
  return { wrapper, api }
}

beforeEach(() => {
  localStorage.clear()
})

describe('useNoteDraft storage', () => {
  it('writes and reads a draft under the given key', () => {
    const key = ref('draft:one')
    const { api, wrapper } = mountDraft(key, ref(false))

    api.write('черновик')

    expect(localStorage.getItem('draft:one')).toBe('черновик')
    expect(api.read()).toBe('черновик')
    wrapper.unmount()
  })

  it('removes the entry when the content becomes empty', () => {
    const key = ref('draft:one')
    const { api, wrapper } = mountDraft(key, ref(false))
    api.write('черновик')

    api.write('')

    expect(localStorage.getItem('draft:one')).toBeNull()
    wrapper.unmount()
  })

  it('discards the draft', () => {
    const key = ref('draft:one')
    const { api, wrapper } = mountDraft(key, ref(false))
    api.write('черновик')

    api.discard()

    expect(api.read()).toBeNull()
    wrapper.unmount()
  })

  it('follows the key when it changes', () => {
    const key = ref('draft:one')
    const { api, wrapper } = mountDraft(key, ref(false))
    api.write('первый')

    key.value = 'draft:two'
    api.write('второй')

    expect(localStorage.getItem('draft:one')).toBe('первый')
    expect(localStorage.getItem('draft:two')).toBe('второй')
    wrapper.unmount()
  })
})

describe('useNoteDraft unload guard', () => {
  it('attaches the guard only while a draft is dirty', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const isDirty = ref(false)
    const { wrapper } = mountDraft(ref('draft:one'), isDirty)

    isDirty.value = true
    await wrapper.vm.$nextTick()
    expect(add).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    isDirty.value = false
    await wrapper.vm.$nextTick()
    expect(remove).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    wrapper.unmount()
    add.mockRestore()
    remove.mockRestore()
  })

  it('releases the guard when a dirty editor unmounts', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const isDirty = ref(true)
    const { wrapper } = mountDraft(ref('draft:one'), isDirty)
    await wrapper.vm.$nextTick()

    wrapper.unmount()

    expect(remove).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    remove.mockRestore()
  })

  it('keeps the guard while a second dirty editor is still mounted', async () => {
    const first = mountDraft(ref('draft:one'), ref(true))
    const second = mountDraft(ref('draft:two'), ref(true))
    await first.wrapper.vm.$nextTick()

    const remove = vi.spyOn(window, 'removeEventListener')
    first.wrapper.unmount()

    expect(remove).not.toHaveBeenCalledWith('beforeunload', expect.any(Function))

    second.wrapper.unmount()
    remove.mockRestore()
  })
})
