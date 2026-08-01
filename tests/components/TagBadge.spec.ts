import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { ITagDto } from '@/apis/dtos/tagDto'
import TagBadge from '@/components/common/TagBadge.vue'
import { contrastRatio } from '@/core/utils/colorPalette'

function tag(overrides: Partial<ITagDto> = {}): ITagDto {
  return {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f601',
    name: 'Любимое',
    color: '#ef4444',
    isHidden: false,
    sortOrder: 0,
    ...overrides,
  }
}

describe('TagBadge', () => {
  it('renders the name and background colour', () => {
    const wrapper = mount(TagBadge, { props: { tag: tag() } })

    expect(wrapper.text()).toContain('Любимое')
    expect(wrapper.attributes('style')).toContain('background-color: #ef4444')
  })

  it('uses light text on a dark colour', () => {
    const wrapper = mount(TagBadge, { props: { tag: tag({ color: '#312e81' }) } })

    expect(wrapper.attributes('style')).toContain('color: #ffffff')
  })

  it('uses dark text on a light colour', () => {
    const wrapper = mount(TagBadge, { props: { tag: tag({ color: '#fde68a' }) } })

    expect(wrapper.attributes('style')).toContain('color: #000000')
  })

  it.each(['#f59e0b', '#14b8a6', '#84cc16'])(
    'clears 4.5:1 on the mid-tone colour %s',
    (color) => {
      const wrapper = mount(TagBadge, { props: { tag: tag({ color }) } })
      const chosen = wrapper.attributes('style')?.includes('color: #000000')
        ? '#000000'
        : '#ffffff'

      expect(contrastRatio(chosen, color)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('renders the icon when one is set', () => {
    const wrapper = mount(TagBadge, { props: { tag: tag({ icon: 'pi-heart' }) } })

    expect(wrapper.find('i.pi-heart').exists()).toBe(true)
  })

  it('omits the icon element when none is set', () => {
    expect(mount(TagBadge, { props: { tag: tag() } }).find('i').exists()).toBe(false)
  })

  it('dims a hidden tag on request', () => {
    const wrapper = mount(TagBadge, { props: { tag: tag(), dimmed: true } })

    expect(wrapper.classes()).toContain('opacity-50')
  })

  it('supports a small size', () => {
    const wrapper = mount(TagBadge, { props: { tag: tag(), size: 'sm' } })

    expect(wrapper.classes().join(' ')).toContain('text-[10px]')
  })
})
