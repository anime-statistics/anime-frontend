import { computed, type ComputedRef, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppI18n } from '@/composables/useAppI18n'
import { primaryTitle } from '@/core/utils/mediaTitle'

export const SORT_FIELDS = ['title', 'score', 'episodesTotal', 'airedFrom', 'addedAt'] as const
export type SortField = (typeof SORT_FIELDS)[number]
export type SortOrder = 'asc' | 'desc'

export const DEFAULT_SORT_FIELD: SortField = 'title'
export const DEFAULT_SORT_ORDER: SortOrder = 'asc'

export interface ISortableItem {
  title: string
  titleRussian?: string
  titleEnglish?: string
  score?: number
  episodesTotal?: number
  airedFrom?: string
  addedAt?: string
}

function readValue(
  item: ISortableItem,
  field: SortField,
  locale: string,
): string | number | undefined {
  switch (field) {
    // Sorting on the raw title would order the list by names the reader cannot
    // see once the Russian ones are displayed.
    case 'title': return primaryTitle(item, locale)
    case 'score': return item.score
    case 'episodesTotal': return item.episodesTotal
    case 'airedFrom': return item.airedFrom
    case 'addedAt': return item.addedAt
  }
}

export function sortItems<T extends ISortableItem>(
  items: readonly T[],
  field: SortField,
  order: SortOrder,
  locale = 'ru',
): T[] {
  const direction = order === 'asc' ? 1 : -1

  return items.toSorted((left, right) => {
    const leftValue = readValue(left, field, locale)
    const rightValue = readValue(right, field, locale)

    // Missing values always sink to the bottom, whichever direction is active.
    if (leftValue === undefined && rightValue === undefined) return 0
    if (leftValue === undefined) return 1
    if (rightValue === undefined) return -1

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction
    }
    return String(leftValue).localeCompare(String(rightValue)) * direction
  })
}

export function useMediaSort<T extends ISortableItem>(items: Ref<readonly T[]>): {
  sortField: ComputedRef<SortField>
  sortOrder: ComputedRef<SortOrder>
  sorted: ComputedRef<T[]>
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
} {
  const route = useRoute()
  const router = useRouter()
  const { locale } = useAppI18n()

  const sortField = computed<SortField>(() => {
    const value = route.query.sort
    return SORT_FIELDS.find((field) => field === value) ?? DEFAULT_SORT_FIELD
  })

  const sortOrder = computed<SortOrder>(() =>
    route.query.order === 'desc' ? 'desc' : DEFAULT_SORT_ORDER,
  )

  const sorted = computed(() =>
    sortItems(items.value, sortField.value, sortOrder.value, locale.value),
  )

  function updateQuery(patch: Record<string, string>): void {
    void router.replace({ query: { ...route.query, ...patch } })
  }

  return {
    sortField,
    sortOrder,
    sorted,
    setSortField: (field: SortField) => updateQuery({ sort: field }),
    setSortOrder: (order: SortOrder) => updateQuery({ order }),
  }
}
