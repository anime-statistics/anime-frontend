import { mount, type VueWrapper } from '@vue/test-utils'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/apis/http/client'
import SearchBar from '@/components/common/SearchBar.vue'
import { DEFAULT_SEARCH_DELAY } from '@/composables/useDebouncedSearch'
import { SEARCH_HISTORY_KEY } from '@/composables/useSearchHistory'
import { i18n } from '@/core/i18n'
import { handlers, resetMockState } from '@/mocks/handlers'
import { useSearchStore } from '@/stores/useSearchStore'

const server = setupServer(...handlers)

function mountSearchBar(): VueWrapper {
  return mount(SearchBar, { global: { plugins: [i18n] } })
}

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://localhost:3000/api/v1/'
  apiClient.defaults.adapter = 'fetch'
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  setActivePinia(createPinia())
  resetMockState()
  localStorage.clear()
})

afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})

afterAll(() => {
  server.close()
})

describe('SearchBar input', () => {
  it('writes typed text into the store', async () => {
    const wrapper = mountSearchBar()
    const store = useSearchStore()

    await wrapper.find('input[type="search"]').setValue('Steins')

    expect(store.rawQuery).toBe('Steins')
    wrapper.unmount()
  })

  it('reflects a store update back into the input', async () => {
    const wrapper = mountSearchBar()
    const store = useSearchStore()

    store.setQuery('Frieren')
    await wrapper.vm.$nextTick()

    expect(wrapper.find<HTMLInputElement>('input[type="search"]').element.value).toBe('Frieren')
    wrapper.unmount()
  })

  it('shows the clear button only once there is a query', async () => {
    const wrapper = mountSearchBar()
    const clearLabel = '[aria-label="Очистить запрос"]'

    expect(wrapper.find(clearLabel).exists()).toBe(false)

    await wrapper.find('input[type="search"]').setValue('Naruto')
    expect(wrapper.find(clearLabel).exists()).toBe(true)

    await wrapper.find(clearLabel).trigger('click')
    expect(useSearchStore().rawQuery).toBe('')
    wrapper.unmount()
  })

  it('exposes the form as a search landmark', () => {
    const wrapper = mountSearchBar()

    expect(wrapper.find('form').attributes('role')).toBe('search')
    wrapper.unmount()
  })
})

describe('SearchBar debounce', () => {
  it('waits out the debounce window before searching', async () => {
    vi.useFakeTimers()
    const wrapper = mountSearchBar()
    const store = useSearchStore()
    const search = vi.spyOn(store, 'search').mockResolvedValue()

    await wrapper.find('input[type="search"]').setValue('Steins')
    expect(search).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(DEFAULT_SEARCH_DELAY)
    expect(search).toHaveBeenCalledOnce()

    wrapper.unmount()
  })

  it('collapses fast typing into a single request', async () => {
    vi.useFakeTimers()
    const wrapper = mountSearchBar()
    const store = useSearchStore()
    const search = vi.spyOn(store, 'search').mockResolvedValue()
    const input = wrapper.find('input[type="search"]')

    await input.setValue('S')
    await vi.advanceTimersByTimeAsync(100)
    await input.setValue('St')
    await vi.advanceTimersByTimeAsync(100)
    await input.setValue('Ste')
    await vi.advanceTimersByTimeAsync(DEFAULT_SEARCH_DELAY)

    expect(search).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('clears the results instead of searching for an empty query', async () => {
    vi.useFakeTimers()
    const wrapper = mountSearchBar()
    const store = useSearchStore()
    const search = vi.spyOn(store, 'search').mockResolvedValue()

    await wrapper.find('input[type="search"]').setValue('Steins')
    await vi.advanceTimersByTimeAsync(DEFAULT_SEARCH_DELAY)
    search.mockClear()

    await wrapper.find('input[type="search"]').setValue('')
    await vi.advanceTimersByTimeAsync(DEFAULT_SEARCH_DELAY)

    expect(search).not.toHaveBeenCalled()
    expect(store.results).toEqual([])
    wrapper.unmount()
  })

  it('searches immediately on submit and records the query in the history', async () => {
    const wrapper = mountSearchBar()
    const store = useSearchStore()
    const search = vi.spyOn(store, 'search').mockResolvedValue()

    await wrapper.find('input[type="search"]').setValue('Steins')
    await wrapper.find('form').trigger('submit')

    expect(search).toHaveBeenCalledOnce()
    expect(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]')).toEqual(['Steins'])
    wrapper.unmount()
  })
})

describe('SearchBar filter suggestions', () => {
  it('suggests filter keys for a partial token', async () => {
    const wrapper = mountSearchBar()
    const input = wrapper.find('input[type="search"]')

    await input.trigger('focus')
    await input.setValue('gen')

    expect(wrapper.find('ul').text()).toContain('genre:')
    wrapper.unmount()
  })

  it('suggests values once the key is typed', async () => {
    const wrapper = mountSearchBar()
    const input = wrapper.find('input[type="search"]')

    await input.trigger('focus')
    await input.setValue('status:wat')

    expect(wrapper.find('ul').text()).toContain('status:watching')
    wrapper.unmount()
  })

  it('replaces the active token when a suggestion is picked', async () => {
    const wrapper = mountSearchBar()
    const input = wrapper.find('input[type="search"]')
    await input.trigger('focus')
    await input.setValue('naruto sta')

    await wrapper.find('ul button').trigger('mousedown')

    expect(useSearchStore().rawQuery).toBe('naruto status:')
    wrapper.unmount()
  })

  it('hides the suggestions while the input is not focused', async () => {
    const wrapper = mountSearchBar()

    await wrapper.find('input[type="search"]').setValue('gen')

    expect(wrapper.find('ul').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('SearchBar history', () => {
  it('restores a stored query when its chip is clicked', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['Frieren']))
    const wrapper = mountSearchBar()

    const chip = wrapper.findAll('button').find((button) => button.text() === 'Frieren')
    await chip?.trigger('click')

    expect(useSearchStore().rawQuery).toBe('Frieren')
    wrapper.unmount()
  })
})
