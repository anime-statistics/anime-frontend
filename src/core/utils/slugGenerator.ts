export type MediaSource = 'shikimori' | 'aniliberty'

export interface ParsedMediaId {
  source: MediaSource
  id: number
  slug: string
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function buildMediaId(source: MediaSource, id: number, title: string): string {
  return `${source}_${id}-${generateSlug(title)}`
}

export function parseMediaId(mediaId: string): ParsedMediaId | null {
  const match = mediaId.match(/^(shikimori|aniliberty)_(\d+)-(.+)$/)
  if (!match) return null
  return {
    source: match[1] as MediaSource,
    id: Number(match[2]),
    slug: match[3],
  }
}
