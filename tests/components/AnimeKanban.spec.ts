import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it } from 'vitest'
import { VueDraggable } from 'vue-draggable-plus'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import AnimeKanban from '@/components/anime/AnimeKanban.vue'
import { i18n } from '@/core/i18n'
import { SEEDED_TAGS, SEEDED_TAG_IDS } from '@/core/constants/seededTags'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTagStore } from '@/stores/useTagStore'

function anime(id: string, myTags: string[]): IAnimeSearchResultDto {
  return {
    id,
    title: id,
    episodesTotal: 12,
    myTags,
    source: 'shikimori',
  }
}

const items = [
  anime('shikimori_1-watching', [SEEDED_TAG_IDS.watching]),
  anime('shikimori_2-planned', [SEEDED_TAG_IDS.planned]),
  anime('shikimori_3-untagged', []),
]

function mountBoard(): VueWrapper {
  return mount(AnimeKanban, {
    props: { items },
    global: { plugins: [i18n, PrimeVue] },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()

  useTagStore().tags = [...SEEDED_TAGS]
  useSettingsStore().update({
    kanbanTagIds: [SEEDED_TAG_IDS.watching, SEEDED_TAG_IDS.planned],
  })
})

describe('AnimeKanban columns', () => {
  it('renders a grip per tag column and none on the catch-all', () => {
    const wrapper = mountBoard()

    expect(wrapper.findAll('.kanban-column-grip')).toHaveLength(2)
    expect(wrapper.findAll('section')).toHaveLength(3)
  })

  it('groups the titles under the tag they wear', () => {
    const headings = mountBoard()
      .findAll('h3')
      .map((heading) => heading.text().replace(/\s+/g, ' '))

    expect(headings[0]).toContain('Смотрю')
    expect(headings[2]).toContain('Остальное')
    expect(headings.every((heading) => heading.includes('1'))).toBe(true)
  })

  // The board order is a setting, so a drop has to outlive the page.
  it('persists the new order once a column is dropped', async () => {
    const wrapper = mountBoard()
    const settingsStore = useSettingsStore()
    const columnDraggable = wrapper.findComponent(VueDraggable)

    await columnDraggable.setValue(
      [SEEDED_TAG_IDS.planned, SEEDED_TAG_IDS.watching].map(
        (id) => SEEDED_TAGS.find((tag) => tag.id === id)!,
      ),
    )
    await columnDraggable.vm.$emit('update')

    expect(settingsStore.settings.kanbanTagIds).toEqual([
      SEEDED_TAG_IDS.planned,
      SEEDED_TAG_IDS.watching,
    ])
    expect(localStorage.getItem('anime-statistics:settings')).toContain(SEEDED_TAG_IDS.planned)
  })

  it('asks for a column tag when none is picked', () => {
    useSettingsStore().update({ kanbanTagIds: [] })

    const wrapper = mountBoard()

    expect(wrapper.text()).toContain('Выберите хотя бы один тег')
    expect(wrapper.findAll('.kanban-column-grip')).toHaveLength(0)
  })
})

describe('AnimeKanban card moves', () => {
  it('swaps the column tag when a card lands in another column', async () => {
    const wrapper = mountBoard()
    const boards = wrapper.findAllComponents(VueDraggable)

    // The first draggable is the column strip; the card lists follow it.
    await boards[2].vm.$emit('add', { data: items[0] })

    expect(wrapper.emitted('tagMove')?.[0]).toEqual([
      {
        mediaId: items[0].id,
        removeTagId: SEEDED_TAG_IDS.watching,
        addTagId: SEEDED_TAG_IDS.planned,
      },
    ])
  })

  it('drops the column tag when a card lands in the catch-all', async () => {
    const wrapper = mountBoard()
    const boards = wrapper.findAllComponents(VueDraggable)

    await boards[3].vm.$emit('add', { data: items[0] })

    expect(wrapper.emitted('tagMove')?.[0]).toEqual([
      {
        mediaId: items[0].id,
        removeTagId: SEEDED_TAG_IDS.watching,
        addTagId: undefined,
      },
    ])
  })
})
