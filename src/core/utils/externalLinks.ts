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

// Both sources expose their data under /api on the same host, so the API twin
// of a page URL is that URL with /api pushed in front of the path — unless the
// address already points at the API.
export function ensureApiUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.pathname === '/api' || parsed.pathname.startsWith('/api/')) return parsed.toString()

  parsed.pathname = parsed.pathname === '/' ? '/api' : `/api${parsed.pathname}`
  return parsed.toString()
}
