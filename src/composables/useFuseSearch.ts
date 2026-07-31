import Fuse from 'fuse.js'
import { computed, type Ref } from 'vue'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'

export function useFuseSearch(items: Ref<IAnimeSearchResultDto[]>) {
  const fuse = computed(
    () =>
      new Fuse(items.value, {
        keys: ['title', 'titleEnglish', 'titleJapanese'],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: true,
      }),
  )

  function search(query: string): IAnimeSearchResultDto[] {
    if (!query.trim()) return items.value
    return fuse.value.search(query).map((result) => result.item)
  }

  return { search }
}
