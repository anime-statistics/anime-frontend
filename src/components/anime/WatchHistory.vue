<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'
import type { IWatchHistoryEntry, IWatchHistoryStats } from '@/composables/useWatchHistory'

const props = defineProps<{ entries: IWatchHistoryEntry[], stats: IWatchHistoryStats }>()
const emit = defineEmits<{ clear: [] }>()

const { translate, translatePlural, locale } = useAppI18n()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <dl class="grid grid-cols-3 gap-3 text-center">
      <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <dt class="text-xs text-gray-500 dark:text-gray-400">
          {{ translate('history.totalEpisodes') }}
        </dt>
        <dd class="text-xl font-semibold tabular-nums">
          {{ props.stats.totalEpisodes }}
        </dd>
      </div>
      <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <dt class="text-xs text-gray-500 dark:text-gray-400">
          {{ translate('history.totalHours') }}
        </dt>
        <dd class="text-xl font-semibold tabular-nums">
          {{ props.stats.totalHours }}
        </dd>
      </div>
      <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <dt class="text-xs text-gray-500 dark:text-gray-400">
          {{ translate('history.averagePerDay') }}
        </dt>
        <dd class="text-xl font-semibold tabular-nums">
          {{ props.stats.averagePerDay }}
        </dd>
      </div>
    </dl>

    <p
      v-if="props.entries.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('history.empty') }}
    </p>

    <template v-else>
      <ol class="flex flex-col gap-2">
        <li
          v-for="entry in [...props.entries].reverse()"
          :key="`${entry.at}-${entry.episodes}`"
          class="flex items-baseline justify-between gap-3 rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-700"
        >
          <span class="text-gray-700 dark:text-gray-200">
            {{ translatePlural('history.entry', entry.episodes) }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(entry.at) }}</span>
        </li>
      </ol>

      <button
        type="button"
        class="self-start text-xs text-gray-500 underline underline-offset-2 hover:text-gray-800 dark:hover:text-gray-200"
        @click="emit('clear')"
      >
        {{ translate('history.clear') }}
      </button>
    </template>
  </section>
</template>
