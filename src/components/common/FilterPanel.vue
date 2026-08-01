<script setup lang="ts">
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import {
  ALL_SOURCES,
  hasFilter,
  parseQueryFilters,
  withFilter,
  withoutFilter,
} from '@/core/utils/filterParser'
import { useTagStore } from '@/stores/useTagStore'

const props = defineProps<{ modelValue: string, genres: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const { translate } = useAppI18n()
const tagStore = useTagStore()

const filters = computed(() => parseQueryFilters(props.modelValue))
// Watch status is a tag now, so one control covers both.
const activeTag = computed(() => filters.value.include.tag?.[0] ?? '')
const activeYear = computed(() => filters.value.include.year?.[0] ?? '')

function toggle(key: string, value: string): void {
  emit(
    'update:modelValue',
    hasFilter(props.modelValue, key, value)
      ? withoutFilter(props.modelValue, key, value)
      : withFilter(props.modelValue, key, value),
  )
}

function replace(key: string, value: string): void {
  const withoutKey = withoutFilter(props.modelValue, key)
  emit('update:modelValue', value ? withFilter(withoutKey, key, value) : withoutKey)
}

function clearAll(): void {
  const cleared = ['source', 'genre', 'year', 'tag'].reduce(
    (query, key) => withoutFilter(query, key),
    props.modelValue,
  )
  emit('update:modelValue', cleared)
}
</script>

<template>
  <section class="flex flex-col gap-4 text-sm">
    <header class="flex items-center justify-between">
      <h2 class="font-semibold text-gray-900 dark:text-gray-100">
        {{ translate('filters.title') }}
      </h2>
      <button
        type="button"
        class="text-xs text-gray-500 underline hover:text-gray-800 dark:hover:text-gray-200"
        @click="clearAll"
      >
        {{ translate('filters.clearAll') }}
      </button>
    </header>

    <fieldset class="flex flex-col gap-1">
      <legend class="pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {{ translate('filters.sources') }}
      </legend>
      <label
        v-for="source in ALL_SOURCES"
        :key="source"
        class="flex items-center gap-2"
      >
        <input
          type="checkbox"
          class="accent-brand-600"
          :checked="hasFilter(props.modelValue, 'source', source)"
          @change="toggle('source', source)"
        >
        <span class="capitalize">{{ source }}</span>
      </label>
    </fieldset>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {{ translate('filters.tag') }}
      </span>
      <select
        class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        :value="activeTag"
        @change="replace('tag', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">
          {{ translate('filters.anyTag') }}
        </option>
        <option
          v-for="tag in tagStore.tags"
          :key="tag.id"
          :value="tag.name"
        >
          {{ tag.name }}
        </option>
      </select>
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {{ translate('filters.year') }}
      </span>
      <input
        type="number"
        min="1960"
        max="2100"
        class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
        :placeholder="translate('filters.anyYear')"
        :value="activeYear"
        @change="replace('year', ($event.target as HTMLInputElement).value)"
      >
    </label>

    <fieldset
      v-if="props.genres.length"
      class="flex flex-col gap-1"
    >
      <legend class="pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {{ translate('filters.genres') }}
      </legend>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="genre in props.genres"
          :key="genre"
          type="button"
          class="rounded-full border px-2 py-0.5 text-xs transition-colors"
          :class="hasFilter(props.modelValue, 'genre', genre.toLowerCase())
            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-gray-800 dark:text-brand-300'
            : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'"
          @click="toggle('genre', genre.toLowerCase())"
        >
          {{ genre }}
        </button>
      </div>
    </fieldset>
  </section>
</template>
