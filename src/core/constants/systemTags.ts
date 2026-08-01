import type { ITagDto } from '@/apis/dtos/tagDto'

// Watch status used to be a fixed enum on the media record. It is a tag now: a
// title can sit in several at once, and the user is free to add their own. These
// six are seeded on first run so the vocabulary is not empty; they cannot be
// deleted, but renaming and recolouring them is fair game.
export const SYSTEM_TAG_IDS = {
  watching: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f701',
  planned: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f702',
  completed: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f703',
  onHold: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f704',
  dropped: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f705',
  rewatching: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f706',
} as const

export type SystemTagKey = keyof typeof SYSTEM_TAG_IDS

export const SYSTEM_TAGS: ITagDto[] = [
  {
    id: SYSTEM_TAG_IDS.watching,
    name: 'Смотрю',
    color: '#22c55e',
    icon: 'pi-play',
    isHidden: false,
    isSystem: true,
    sortOrder: 0,
  },
  {
    id: SYSTEM_TAG_IDS.planned,
    name: 'Запланировано',
    color: '#3b82f6',
    icon: 'pi-bookmark',
    isHidden: false,
    isSystem: true,
    sortOrder: 1,
  },
  {
    id: SYSTEM_TAG_IDS.completed,
    name: 'Просмотрено',
    color: '#8b5cf6',
    icon: 'pi-check-circle',
    isHidden: false,
    isSystem: true,
    sortOrder: 2,
  },
  {
    id: SYSTEM_TAG_IDS.onHold,
    name: 'Отложено',
    color: '#f59e0b',
    icon: 'pi-pause',
    isHidden: false,
    isSystem: true,
    sortOrder: 3,
  },
  {
    id: SYSTEM_TAG_IDS.dropped,
    name: 'Брошено',
    color: '#ef4444',
    icon: 'pi-times-circle',
    isHidden: false,
    isSystem: true,
    sortOrder: 4,
  },
  {
    id: SYSTEM_TAG_IDS.rewatching,
    name: 'Пересматриваю',
    color: '#06b6d4',
    icon: 'pi-replay',
    isHidden: false,
    isSystem: true,
    sortOrder: 5,
  },
]

export const SYSTEM_TAG_ID_SET: ReadonlySet<string> = new Set(Object.values(SYSTEM_TAG_IDS))

export function isSystemTagId(id: string): boolean {
  return SYSTEM_TAG_ID_SET.has(id)
}
