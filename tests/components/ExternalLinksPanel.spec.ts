import { mount, type VueWrapper } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import type { IExternalLinkDto } from '@/apis/dtos/externalLinkDto'
import ExternalLinksPanel from '@/components/common/ExternalLinksPanel.vue'
import { i18n } from '@/core/i18n'

const MEDIA_ID = 'shikimori_5114-fullmetal-alchemist-brotherhood'

function mountPanel(links?: IExternalLinkDto[]): VueWrapper {
  return mount(ExternalLinksPanel, {
    props: { mediaId: MEDIA_ID, kind: 'anime', links },
    global: { plugins: [i18n, PrimeVue] },
    attachTo: document.body,
  })
}

async function openEditor(wrapper: VueWrapper): Promise<void> {
  await wrapper.find('[data-testid="links-edit"]').trigger('click')
}

// The dialog is teleported to the body, so its contents live outside the wrapper.
function inputs(): HTMLInputElement[] {
  return [...document.querySelectorAll<HTMLInputElement>('.p-dialog input')]
}

async function setInput(input: HTMLInputElement, value: string): Promise<void> {
  input.value = value
  input.dispatchEvent(new Event('input'))
  await nextTick()
}

async function clickSave(): Promise<void> {
  document.querySelector<HTMLButtonElement>('[data-testid="links-save"]')!.click()
  await nextTick()
}

describe('ExternalLinksPanel display', () => {
  it('shows both the page and the api link', () => {
    const wrapper = mountPanel([
      {
        source: 'shikimori',
        url: 'https://shikimori.one/animes/5114',
        apiUrl: 'https://shikimori.one/api/animes/5114',
      },
    ])
    const hrefs = wrapper.findAll('a').map((anchor) => anchor.attributes('href'))

    expect(hrefs).toEqual([
      'https://shikimori.one/animes/5114',
      'https://shikimori.one/api/animes/5114',
    ])
  })

  // A link imported before the api half existed still gets one.
  it('derives the api link when the saved one has none', () => {
    const wrapper = mountPanel([
      { source: 'shikimori', url: 'https://shikimori.one/animes/5114' },
    ])

    expect(wrapper.findAll('a')[1].attributes('href')).toBe(
      'https://shikimori.one/api/animes/5114',
    )
  })

  it('falls back to the address built from the media id', () => {
    const wrapper = mountPanel()

    expect(wrapper.findAll('a')[0].attributes('href')).toBe(
      'https://shikimori.one/animes/5114',
    )
  })
})

describe('ExternalLinksPanel editing', () => {
  it('offers a row for every known source, filled or not', async () => {
    const wrapper = mountPanel([
      { source: 'shikimori', url: 'https://shikimori.one/animes/5114' },
    ])
    await openEditor(wrapper)

    // Two rows of two inputs: the saved shikimori link and an empty aniliberty one.
    expect(inputs()).toHaveLength(4)
    expect(inputs()[2].value).toBe('')

    wrapper.unmount()
  })

  it('fills the api url in as the page url is typed', async () => {
    const wrapper = mountPanel()
    await openEditor(wrapper)

    await setInput(inputs()[0], 'https://aniliberty.top/anime/frieren')

    expect(inputs()[1].value).toBe('https://aniliberty.top/api/anime/frieren')

    wrapper.unmount()
  })

  it('emits the edited pair and skips the rows left empty', async () => {
    const wrapper = mountPanel()
    await openEditor(wrapper)

    await setInput(inputs()[0], 'https://shikimori.one/animes/9999')
    await clickSave()

    expect(wrapper.emitted('save')?.[0]).toEqual([
      [
        {
          source: 'shikimori',
          url: 'https://shikimori.one/animes/9999',
          apiUrl: 'https://shikimori.one/api/animes/9999',
        },
      ],
    ])

    wrapper.unmount()
  })

  it('refuses to save an address that is not a url', async () => {
    const wrapper = mountPanel()
    await openEditor(wrapper)

    await setInput(inputs()[0], 'shikimori.one/animes/9999')
    await clickSave()

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(document.querySelector('.p-dialog')?.textContent).toContain('Некорректная ссылка')

    wrapper.unmount()
  })
})
