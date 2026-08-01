import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import type { IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import { animeSearchResults } from '@/mocks/fixtures/animeData'
import { mangaSearchResults } from '@/mocks/fixtures/mangaData'

// The mock backend's database. Search reads the whole catalogue from here and
// the library reads the tagged subset, so tagging a title from search moves it
// into the collection without a second source of truth.
export const mediaState: {
  anime: IAnimeSearchResultDto[]
  manga: IMangaSearchResultDto[]
} = {
  anime: [...animeSearchResults],
  manga: [...mangaSearchResults],
}

export function resetMediaState(): void {
  mediaState.anime = [...animeSearchResults]
  mediaState.manga = [...mangaSearchResults]
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
