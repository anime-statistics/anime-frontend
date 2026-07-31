import { parseMediaId, type MediaSource } from '@/core/utils/slugGenerator'

export type MediaKind = 'anime' | 'manga'

const BASE_URLS: Record<MediaSource, string> = {
  shikimori: 'https://shikimori.one',
  aniliberty: 'https://aniliberty.top',
}

export function buildExternalUrl(mediaId: string, kind: MediaKind = 'anime'): string | null {
  const parsed = parseMediaId(mediaId)
  if (!parsed) return null

  if (parsed.source === 'shikimori') {
    return `${BASE_URLS.shikimori}/${kind === 'anime' ? 'animes' : 'mangas'}/${parsed.id}`
  }
  return `${BASE_URLS.aniliberty}/${kind === 'anime' ? 'anime' : 'manga'}/${parsed.slug}`
}

export function buildInternalUrl(mediaId: string, kind: MediaKind = 'anime'): string {
  return `/${kind}/${mediaId}`
}
