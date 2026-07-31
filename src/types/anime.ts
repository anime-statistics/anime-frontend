import type { MediaSource } from '@/core/utils/slugGenerator'

export type IAnimeStatus
  = | 'watching'
    | 'planned'
    | 'completed'
    | 'on_hold'
    | 'dropped'
    | 'rewatching'

export interface IAnimeExternalLink {
  source: string
  url: string
}

export interface IAnimeEpisode {
  number: number
  title?: string
  airedAt?: string
  watched: boolean
  watchedAt?: string
}

export interface IAnimeRelation {
  id: string
  title: string
  relation: string
}

export interface IAnime {
  id: string
  title: string
  titleJapanese?: string
  titleEnglish?: string
  episodesTotal: number
  watchedEpisodes: number
  status: IAnimeStatus
  score?: number
  imageUrl?: string
  synopsis?: string
  genres: string[]
  airedFrom?: string
  airedTo?: string
  rating?: string
  duration?: number
  source: MediaSource
  tagIds: string[]
  episodes: IAnimeEpisode[]
  externalLinks: IAnimeExternalLink[]
  relatedAnime: IAnimeRelation[]
  createdAt: string
  updatedAt: string
}
