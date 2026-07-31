import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { axe } from 'vitest-axe'
import type { AxeResults } from 'axe-core'
import AnimeCard from '@/components/anime/AnimeCard.vue'
import AnimeTable from '@/components/anime/AnimeTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import TagSelector from '@/components/common/TagSelector.vue'
import MobileNav from '@/components/layout/MobileNav.vue'
import { i18n } from '@/core/i18n'
import type { IMergedAnimeSearchResult } from '@/mocks/mediaAdapter'

const anime: IMergedAnimeSearchResult = {
  id: 'shikimori_9253-steins-gate',
  title: 'Steins;Gate',
  episodesTotal: 24,
  status: 'completed',
  score: 9,
  imageUrl: 'https://example.com/steins-gate.jpg',
  genres: ['Sci-Fi', 'Thriller'],
  source: 'shikimori',
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div />' } },
    { path: '/search', name: 'search', component: { template: '<div />' } },
    { path: '/tags', name: 'tags', component: { template: '<div />' } },
    { path: '/settings', name: 'settings', component: { template: '<div />' } },
    { path: '/anime/:id', name: 'anime-detail', component: { template: '<div />' } },
  ],
})

const plugins = [i18n, router, PrimeVue]

let mounted: VueWrapper[] = []

// @vue/test-utils infers props per component; this helper deliberately erases
// that inference so one signature can audit every component in the suite.
function mountForAudit(component: Component, props: Record<string, unknown> = {}): VueWrapper {
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: { plugins },
  } as never) as unknown as VueWrapper

  mounted.push(wrapper)
  return wrapper
}

async function auditOf(wrapper: VueWrapper): Promise<AxeResults> {
  return (await axe(wrapper.element as HTMLElement)) as AxeResults
}

beforeEach(async () => {
  setActivePinia(createPinia())
  await router.push('/')
  await router.isReady()
})

afterEach(() => {
  for (const wrapper of mounted) wrapper.unmount()
  mounted = []
  document.body.innerHTML = ''
})

describe('component accessibility', () => {
  it('AnimeCard has no violations', async () => {
    const results = await auditOf(mountForAudit(AnimeCard, { anime, selectable: true }))

    expect(results.violations).toEqual([])
  })

  it('AnimeTable has no violations', async () => {
    const results = await auditOf(mountForAudit(AnimeTable, { items: [anime] }))

    expect(results.violations).toEqual([])
  })

  it('SearchBar has no violations', async () => {
    const results = await auditOf(mountForAudit(SearchBar))

    expect(results.violations).toEqual([])
  })

  it('TagSelector has no violations', async () => {
    const results = await auditOf(mountForAudit(TagSelector, { modelValue: [] }))

    expect(results.violations).toEqual([])
  })

  it('Pagination has no violations', async () => {
    const results = await auditOf(mountForAudit(Pagination, { page: 1, size: 10, total: 40 }))

    expect(results.violations).toEqual([])
  })

  it('MobileNav has no violations', async () => {
    const results = await auditOf(mountForAudit(MobileNav))

    expect(results.violations).toEqual([])
  })
})

describe('icon-only controls carry a label', () => {
  it('labels every button without visible text', () => {
    const wrapper = mountForAudit(AnimeCard, { anime, selectable: true })

    for (const button of wrapper.findAll('button')) {
      const hasText = button.text().trim().length > 0
      const hasLabel = Boolean(button.attributes('aria-label') ?? button.attributes('title'))
      expect(hasText || hasLabel).toBe(true)
    }
  })

  it('gives every image an alt attribute', () => {
    const wrapper = mountForAudit(AnimeCard, { anime })

    for (const image of wrapper.findAll('img')) {
      expect(image.attributes('alt')).toBeDefined()
    }
  })
})
