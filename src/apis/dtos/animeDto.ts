import { z } from 'zod'

export const ANIME_STATUSES = [
  'watching',
  'planned',
  'completed',
  'on_hold',
  'dropped',
  'rewatching',
] as const

export const MEDIA_SOURCES = ['shikimori', 'aniliberty'] as const

export const AnimeSearchResultDto = z.object({
  id: z.string().regex(/^(shikimori|aniliberty)_\d+-[\w-]+$/),
  title: z.string().min(1),
  titleJapanese: z.string().optional(),
  titleEnglish: z.string().optional(),
  episodesTotal: z.number().int().positive(),
  status: z.enum(ANIME_STATUSES),
  score: z.number().min(0).max(10).optional(),
  imageUrl: z.string().url().optional(),
  synopsis: z.string().optional(),
  genres: z.array(z.string()).optional(),
  airedFrom: z.string().optional(),
  airedTo: z.string().optional(),
  source: z.enum(MEDIA_SOURCES),
})
export type IAnimeSearchResultDto = z.infer<typeof AnimeSearchResultDto>

export const AnimeDetailDto = AnimeSearchResultDto.extend({
  englishTitle: z.string().optional(),
  japaneseTitle: z.string().optional(),
  rating: z.string().optional(),
  duration: z.number().optional(),
  relatedAnime: z
    .array(z.object({ id: z.string(), title: z.string(), relation: z.string() }))
    .optional(),
  myTags: z.array(z.string()).optional(),
  watchedEpisodes: z.number().int().min(0).optional(),
  externalLinks: z.array(z.object({ source: z.string(), url: z.string().url() })).optional(),
})
export type IAnimeDetailDto = z.infer<typeof AnimeDetailDto>

export const AnimeStatusUpdateDto = z.object({
  status: z.enum(ANIME_STATUSES),
  score: z.number().min(0).max(10).optional(),
  watchedEpisodes: z.number().int().min(0).optional(),
})
export type IAnimeStatusUpdateDto = z.infer<typeof AnimeStatusUpdateDto>
