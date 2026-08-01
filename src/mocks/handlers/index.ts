import { aiHandlers } from '@/mocks/handlers/aiHandlers'
import { animeHandlers } from '@/mocks/handlers/animeHandlers'
import { mangaHandlers } from '@/mocks/handlers/mangaHandlers'
import { noteHandlers, resetNoteState } from '@/mocks/handlers/noteHandlers'
import { resetRateLimit } from '@/mocks/handlers/rateLimit'
import { searchHandlers } from '@/mocks/handlers/searchHandlers'
import { syncHandlers } from '@/mocks/handlers/syncHandlers'
import { tagHandlers, resetTagState } from '@/mocks/handlers/tagHandlers'
import { resetMediaState } from '@/mocks/state/mediaState'

export const handlers = [
  ...searchHandlers,
  ...animeHandlers,
  ...mangaHandlers,
  ...tagHandlers,
  ...noteHandlers,
  ...syncHandlers,
  ...aiHandlers,
]

export function resetMockState(): void {
  resetMediaState()
  resetTagState()
  resetNoteState()
  resetRateLimit()
}
