import type { ITagDto } from '@/apis/dtos/tagDto'
import { SEEDED_TAGS } from '@/core/constants/seededTags'

const ownTags: ITagDto[] = [
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f601',
    name: 'Любимое',
    color: '#ef4444',
    icon: 'pi-heart',
    isHidden: false,
    sortOrder: 6,
  },
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f602',
    name: 'Классика',
    color: '#f59e0b',
    icon: 'pi-star',
    isHidden: false,
    sortOrder: 7,
  },
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f603',
    name: 'Пересмотреть',
    color: '#10b981',
    icon: 'pi-replay',
    isHidden: false,
    sortOrder: 8,
  },
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f604',
    name: 'Сезонное',
    color: '#6366f1',
    icon: 'pi-calendar',
    isHidden: false,
    sortOrder: 9,
  },
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f605',
    name: 'С друзьями',
    color: '#8b5cf6',
    icon: 'pi-users',
    isHidden: false,
    sortOrder: 10,
  },
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f606',
    name: 'Саундтрек',
    color: '#ec4899',
    icon: 'pi-volume-up',
    isHidden: false,
    sortOrder: 11,
  },
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f607',
    name: 'Длинное',
    color: '#0ea5e9',
    icon: 'pi-clock',
    isHidden: false,
    sortOrder: 12,
  },
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f608',
    name: 'Спорное',
    color: '#64748b',
    icon: 'pi-question-circle',
    isHidden: true,
    sortOrder: 13,
  },
  {
    id: '0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f609',
    name: 'Экранизация манги',
    color: '#14b8a6',
    icon: 'pi-book',
    isHidden: false,
    sortOrder: 14,
  },
]

export const tags: ITagDto[] = [...SEEDED_TAGS, ...ownTags]
