<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'
import type { SortField, SortOrder } from '@/composables/useMediaSort'

const props = defineProps<{ field: SortField, order: SortOrder }>()
const emit = defineEmits<{ 'update:field': [SortField], 'update:order': [SortOrder] }>()

const { translate } = useAppI18n()

const SORT_OPTIONS = [
  { value: 'title', labelKey: 'sort.title' },
  { value: 'score', labelKey: 'sort.score' },
  { value: 'episodesTotal', labelKey: 'sort.episodes' },
  { value: 'airedFrom', labelKey: 'sort.aired' },
  { value: 'addedAt', labelKey: 'sort.added' },
] as const

function onFieldChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  const option = SORT_OPTIONS.find((item) => item.value === value)
  if (option) emit('update:field', option.value)
}
</script>

<template>
  <div class="flex items-center gap-2 text-sm">
    <label
      class="sr-only"
      for="sort-field"
    >{{ translate('sort.label') }}</label>
    <select
      id="sort-field"
      class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      :value="props.field"
      @change="onFieldChange"
    >
      <option
        v-for="option in SORT_OPTIONS"
        :key="option.value"
        :value="option.value"
      >
        {{ translate(option.labelKey) }}
      </option>
    </select>

    <button
      type="button"
      class="rounded-lg border border-gray-200 px-2 py-1.5 text-gray-500 transition-colors hover:border-brand-400 dark:border-gray-700 dark:text-gray-400"
      :aria-label="props.order === 'asc' ? translate('sort.ascending') : translate('sort.descending')"
      @click="emit('update:order', props.order === 'asc' ? 'desc' : 'asc')"
    >
      <i :class="['pi', props.order === 'asc' ? 'pi-sort-amount-up' : 'pi-sort-amount-down']" />
    </button>
  </div>
</template>
