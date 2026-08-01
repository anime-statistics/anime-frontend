export interface ITitledMedia {
  title: string
  titleRussian?: string
  titleEnglish?: string
  titleJapanese?: string
}

/**
 * Shikimori and AniLiberty both carry a Russian name next to the romaji one.
 * Russian readers expect that name first; everyone else keeps the original.
 */
export function primaryTitle(media: ITitledMedia, locale: string): string {
  return locale === 'ru' && media.titleRussian ? media.titleRussian : media.title
}

/** The best alternative spelling to show under the primary one, if any. */
export function secondaryTitle(media: ITitledMedia, locale: string): string | undefined {
  const primary = primaryTitle(media, locale)
  const alternatives = locale === 'ru'
    ? [media.title, media.titleEnglish]
    : [media.titleRussian, media.titleEnglish]

  return alternatives.find((candidate) => candidate !== undefined && candidate !== primary)
}
