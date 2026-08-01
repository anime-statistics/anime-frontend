import { z } from 'zod'

export const MEDIA_SOURCES = ['shikimori', 'aniliberty'] as const

export const AnimeSearchResultDto = z.object({
  id: z.string().regex(/^(shikimori|aniliberty)_\d+-[\w-]+$/),
  title: z.string().min(1),
  titleRussian: z.string().optional(),
  titleJapanese: z.string().optional(),
  titleEnglish: z.string().optional(),
  // Announced titles have no episode count yet, so zero is a valid answer.
  episodesTotal: z.number().int().nonnegative(),
  score: z.number().min(0).max(10).optional(),
  imageUrl: z.string().url().optional(),
  synopsis: z.string().optional(),
  genres: z.array(z.string()).optional(),
  airedFrom: z.string().optional(),
  airedTo: z.string().optional(),
  // The only per-title state the user owns. An empty array means the title is in
  // the catalogue but not in the collection.
  myTags: z.array(z.string()).default([]),
  source: z.enum(MEDIA_SOURCES),
  // Set by the backend when it merged the same title from a second source.
  secondarySource: z.enum(MEDIA_SOURCES).optional(),
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
  watchedEpisodes: z.number().int().min(0).optional(),
  externalLinks: z.array(z.object({ source: z.string(), url: z.string().url() })).optional(),
})
export type IAnimeDetailDto = z.infer<typeof AnimeDetailDto>

export const AnimeProgressUpdateDto = z.object({
  score: z.number().min(0).max(10).optional(),
  watchedEpisodes: z.number().int().min(0).optional(),
})
export type IAnimeProgressUpdateDto = z.infer<typeof AnimeProgressUpdateDto>

export const AnimeTagsUpdateDto = z.object({
  myTags: z.array(z.string()),
})
export type IAnimeTagsUpdateDto = z.infer<typeof AnimeTagsUpdateDto>
