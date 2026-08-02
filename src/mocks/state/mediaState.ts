import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import type { IExternalLinkDto } from '@/apis/dtos/externalLinkDto'
import type { IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import { animeSearchResults } from '@/mocks/fixtures/animeData'
import { mangaSearchResults } from '@/mocks/fixtures/mangaData'

// The mock backend's database. Search reads the whole catalogue from here and
// the library reads the tagged subset, so tagging a title from search moves it
// into the collection without a second source of truth. Edited external links
// live beside the records because the detail fixtures are static.
export const mediaState: {
  anime: IAnimeSearchResultDto[]
  manga: IMangaSearchResultDto[]
  animeLinks: Record<string, IExternalLinkDto[]>
  mangaLinks: Record<string, IExternalLinkDto[]>
} = {
  anime: [...animeSearchResults],
  manga: [...mangaSearchResults],
  animeLinks: {},
  mangaLinks: {},
}

export function resetMediaState(): void {
  mediaState.anime = [...animeSearchResults]
  mediaState.manga = [...mangaSearchResults]
  mediaState.animeLinks = {}
  mediaState.mangaLinks = {}
}

export function readExternalLinks(value: unknown): IExternalLinkDto[] | null {
  if (!Array.isArray(value)) return null

  const links: IExternalLinkDto[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return null
    const { source, url, apiUrl } = entry as Record<string, unknown>
    if (typeof source !== 'string' || !source || typeof url !== 'string' || !url) return null
    links.push({
      source,
      url,
      apiUrl: typeof apiUrl === 'string' && apiUrl ? apiUrl : undefined,
    })
  }
  return links
}

export function isInCollection(item: { myTags?: string[] }): boolean {
  return (item.myTags ?? []).length > 0
}

export interface ITagPatch {
  add?: string[]
  remove?: string[]
  clear?: boolean
}

export function applyTagPatch(current: readonly string[] | undefined, patch: ITagPatch): string[] {
  if (patch.clear) return []

  const removed = new Set(patch.remove ?? [])
  const next = (current ?? []).filter((id) => !removed.has(id))
  for (const id of patch.add ?? []) {
    if (!next.includes(id)) next.push(id)
  }
  return next
}
