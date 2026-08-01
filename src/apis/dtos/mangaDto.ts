import { z } from 'zod'
import { MEDIA_SOURCES } from '@/apis/dtos/animeDto'

export const MANGA_STATUSES = [
  'reading',
  'planned',
  'completed',
  'on_hold',
  'dropped',
] as const

export type MangaStatus = (typeof MANGA_STATUSES)[number]

export const MangaSearchResultDto = z.object({
  id: z.string().regex(/^(shikimori|aniliberty)_\d+-[\w-]+$/),
  title: z.string().min(1),
  titleRussian: z.string().optional(),
  titleJapanese: z.string().optional(),
  titleEnglish: z.string().optional(),
  volumesTotal: z.number().int().nonnegative(),
  chaptersTotal: z.number().int().nonnegative(),
  status: z.enum(MANGA_STATUSES),
  score: z.number().min(0).max(10).optional(),
  imageUrl: z.string().url().optional(),
  synopsis: z.string().optional(),
  genres: z.array(z.string()).optional(),
  publishedFrom: z.string().optional(),
  publishedTo: z.string().optional(),
  myTags: z.array(z.string()).optional(),
  source: z.enum(MEDIA_SOURCES),
})
export type IMangaSearchResultDto = z.infer<typeof MangaSearchResultDto>

export const MangaDetailDto = MangaSearchResultDto.extend({
  authors: z.array(z.string()).optional(),
  myTags: z.array(z.string()).optional(),
  volumesRead: z.number().int().min(0).optional(),
  chaptersRead: z.number().int().min(0).optional(),
  relatedManga: z
    .array(z.object({ id: z.string(), title: z.string(), relation: z.string() }))
    .optional(),
  externalLinks: z.array(z.object({ source: z.string(), url: z.string().url() })).optional(),
})
export type IMangaDetailDto = z.infer<typeof MangaDetailDto>

export const MangaStatusUpdateDto = z.object({
  status: z.enum(MANGA_STATUSES),
  score: z.number().min(0).max(10).optional(),
  volumesRead: z.number().int().min(0).optional(),
  chaptersRead: z.number().int().min(0).optional(),
})
export type IMangaStatusUpdateDto = z.infer<typeof MangaStatusUpdateDto>
