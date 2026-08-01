<script setup lang="ts">
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { buildDiffHunks, buildDiffRows, countDiff } from '@/core/utils/noteDiff'

const props = defineProps<{ before: string, after: string }>()

const { translate } = useAppI18n()

const rows = computed(() => buildDiffRows(props.before, props.after))
const hunks = computed(() => buildDiffHunks(rows.value))
const stats = computed(() => countDiff(rows.value))

const ROW_CLASSES = {
  add: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  remove: 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200',
  context: 'text-gray-600 dark:text-gray-400',
} as const

const MARKERS = { add: '+', remove: '-', context: ' ' } as const
</script>

<template>
  <section
    class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
    :aria-label="translate('notes.diffTitle')"
  >
    <header
      class="flex flex-wrap items-center gap-3 border-b border-gray-200 px-3 py-2 text-xs dark:border-gray-700"
    >
      <span class="font-medium text-gray-700 dark:text-gray-200">
        {{ translate('notes.diffTitle') }}
      </span>
      <span
        v-if="stats.added"
        class="text-emerald-600 dark:text-emerald-400"
      >+{{ stats.added }}</span>
      <span
        v-if="stats.removed"
        class="text-red-600 dark:text-red-400"
      >−{{ stats.removed }}</span>
    </header>

    <p
      v-if="hunks.length === 0"
      class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
    >
      {{ translate('notes.noChanges') }}
    </p>

    <div
      v-else
      class="max-h-80 overflow-auto font-mono text-xs leading-relaxed"
    >
      <template
        v-for="hunk in hunks"
        :key="hunk.header"
      >
        <p class="bg-gray-100 px-3 py-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {{ hunk.header }}
        </p>
        <p
          v-for="(row, index) in hunk.rows"
          :key="`${hunk.header}-${index}`"
          class="flex gap-2 whitespace-pre-wrap break-words px-3"
          :class="ROW_CLASSES[row.kind]"
        >
          <span class="w-8 shrink-0 select-none text-right text-gray-400 dark:text-gray-500">
            {{ row.oldLine ?? '' }}
          </span>
          <span class="w-8 shrink-0 select-none text-right text-gray-400 dark:text-gray-500">
            {{ row.newLine ?? '' }}
          </span>
          <span
            class="w-3 shrink-0 select-none"
            aria-hidden="true"
          >{{ MARKERS[row.kind] }}</span>
          <span class="min-w-0 flex-1">{{ row.text || ' ' }}</span>
        </p>
      </template>
    </div>
  </section>
</template>
