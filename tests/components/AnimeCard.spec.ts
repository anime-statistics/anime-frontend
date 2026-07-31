import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import AnimeCard from '@/components/anime/AnimeCard.vue'
import { i18n } from '@/core/i18n'
import type { IMergedAnimeSearchResult } from '@/mocks/mediaAdapter'

const anime: IMergedAnimeSearchResult = {
  id: 'shikimori_9253-steins-gate',
  title: 'Steins;Gate',
  episodesTotal: 24,
  status: 'completed',
  score: 9,
  imageUrl: 'https://example.com/steins-gate.jpg',
  genres: ['Sci-Fi', 'Thriller', 'Drama', 'Psychological'],
  source: 'shikimori',
  secondarySource: 'aniliberty',
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div />' } },
    { path: '/anime/:id', name: 'anime-detail', component: { template: '<div />' } },
  ],
})

function mountCard(props: Partial<InstanceType<typeof AnimeCard>['$props']> = {}) {
  return mount(AnimeCard, {
    props: { anime, ...props },
    global: { plugins: [i18n, router, PrimeVue] },
  })
}

describe('AnimeCard rendering', () => {
  it('renders the title, episode count and score', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('Steins;Gate')
    expect(wrapper.text()).toContain('24 эпизода')
    expect(wrapper.text()).toContain('9/10')
  })

  it('links to the detail route', () => {
    const wrapper = mountCard()

    expect(wrapper.find('a').attributes('href')).toBe('/anime/shikimori_9253-steins-gate')
  })

  it('shows both sources when the entry was merged', () => {
    const text = mountCard().text()

    expect(text).toContain('shikimori')
    expect(text).toContain('aniliberty')
  })

  it('caps the genre list at three entries', () => {
    const text = mountCard().text()

    expect(text).toContain('Sci-Fi')
    expect(text).toContain('Drama')
    expect(text).not.toContain('Psychological')
  })

  it('hides genres in compact mode', () => {
    expect(mountCard({ compact: true }).text()).not.toContain('Sci-Fi')
  })

  it('falls back to a placeholder when the image fails to load', async () => {
    const wrapper = mountCard()
    expect(wrapper.find('img').exists()).toBe(true)

    await wrapper.find('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.pi-image').exists()).toBe(true)
  })
})

describe('AnimeCard selection', () => {
  it('hides the checkbox unless selectable', () => {
    expect(mountCard().find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('emits toggleSelect with the media id', async () => {
    const wrapper = mountCard({ selectable: true })

    await wrapper.find('input[type="checkbox"]').setValue(true)

    expect(wrapper.emitted('toggleSelect')).toEqual([['shikimori_9253-steins-gate']])
  })

  it('marks the card when selected', () => {
    expect(mountCard({ selectable: true, selected: true }).classes()).toContain('ring-2')
  })
})

describe('AnimeCard context menu', () => {
  it('emits openMenu with the pointer position', async () => {
    const wrapper = mountCard()

    await wrapper.trigger('contextmenu', { clientX: 120, clientY: 45 })

    expect(wrapper.emitted('openMenu')?.[0]).toEqual([
      { mediaId: 'shikimori_9253-steins-gate', source: 'shikimori', x: 120, y: 45 },
    ])
  })
})
