import type { MediaSource } from '@/core/utils/slugGenerator'

export type IMangaStatus = 'reading' | 'planned' | 'completed' | 'on_hold' | 'dropped'

export interface IMangaChapter {
  number: number
  title?: string
  read: boolean
  readAt?: string
}

export interface IMangaVolume {
  number: number
  chapters: IMangaChapter[]
  read: boolean
}

export interface IMangaRelation {
  id: string
  title: string
  relation: string
}

export interface IManga {
  id: string
  title: string
  titleJapanese?: string
  titleEnglish?: string
  volumesTotal: number
  chaptersTotal: number
  volumesRead: number
  chaptersRead: number
  status: IMangaStatus
  score?: number
  imageUrl?: string
  synopsis?: string
  genres: string[]
  authors: string[]
  publishedFrom?: string
  publishedTo?: string
  source: MediaSource
  tagIds: string[]
  volumes: IMangaVolume[]
  relatedManga: IMangaRelation[]
  createdAt: string
  updatedAt: string
}
