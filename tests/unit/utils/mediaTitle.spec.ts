import { describe, expect, it } from 'vitest'
import { primaryTitle, secondaryTitle, type ITitledMedia } from '@/core/utils/mediaTitle'

const media: ITitledMedia = {
  title: 'Sousou no Frieren',
  titleRussian: 'Провожающая в последний путь Фрирен',
  titleEnglish: 'Frieren: Beyond Journey\'s End',
  titleJapanese: '葬送のフリーレン',
}

describe('primaryTitle', () => {
  it('prefers the Russian name for a Russian locale', () => {
    expect(primaryTitle(media, 'ru')).toBe('Провожающая в последний путь Фрирен')
  })

  it('keeps the original for other locales', () => {
    expect(primaryTitle(media, 'en')).toBe('Sousou no Frieren')
  })

  it('falls back to the original when no Russian name exists', () => {
    expect(primaryTitle({ title: 'Naruto' }, 'ru')).toBe('Naruto')
  })
})

describe('secondaryTitle', () => {
  it('shows the original beneath the Russian name', () => {
    expect(secondaryTitle(media, 'ru')).toBe('Sousou no Frieren')
  })

  it('shows the Russian name beneath the original', () => {
    expect(secondaryTitle(media, 'en')).toBe('Провожающая в последний путь Фрирен')
  })

  it('skips an alternative identical to the primary one', () => {
    const sameName: ITitledMedia = { title: 'Death Note', titleEnglish: 'Death Note' }

    expect(secondaryTitle(sameName, 'en')).toBeUndefined()
  })

  it('falls back to the English name when the original matches the Russian one', () => {
    const dubbed: ITitledMedia = {
      title: 'Атака титанов',
      titleRussian: 'Атака титанов',
      titleEnglish: 'Attack on Titan',
    }

    expect(secondaryTitle(dubbed, 'ru')).toBe('Attack on Titan')
  })

  it('returns nothing when only one spelling is known', () => {
    expect(secondaryTitle({ title: 'Naruto' }, 'ru')).toBeUndefined()
  })
})
