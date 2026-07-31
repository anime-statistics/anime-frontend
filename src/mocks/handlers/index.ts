import { aiHandlers } from '@/mocks/handlers/aiHandlers'
import { animeHandlers, resetAnimeState } from '@/mocks/handlers/animeHandlers'
import { mangaHandlers, resetMangaState } from '@/mocks/handlers/mangaHandlers'
import { noteHandlers, resetNoteState } from '@/mocks/handlers/noteHandlers'
import { resetRateLimit } from '@/mocks/handlers/rateLimit'
import { syncHandlers } from '@/mocks/handlers/syncHandlers'
import { tagHandlers, resetTagState } from '@/mocks/handlers/tagHandlers'

export const handlers = [
  ...animeHandlers,
  ...mangaHandlers,
  ...tagHandlers,
  ...noteHandlers,
  ...syncHandlers,
  ...aiHandlers,
]

export function resetMockState(): void {
  resetAnimeState()
  resetMangaState()
  resetTagState()
  resetNoteState()
  resetRateLimit()
}
