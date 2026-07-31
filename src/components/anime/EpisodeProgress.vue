<script setup lang="ts">
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import type { AppMessageKey } from '@/core/i18n/types'

const props = withDefaults(
  defineProps<{
    watched: number
    total: number
    isBusy?: boolean
    gridLimit?: number
    pluralKey?: AppMessageKey
    nextLabelKey?: AppMessageKey
    gridLabelKey?: AppMessageKey
    itemLabelKey?: AppMessageKey
  }>(),
  {
    isBusy: false,
    gridLimit: 100,
    pluralKey: 'anime.episodes',
    nextLabelKey: 'detail.markNext',
    gridLabelKey: 'detail.episodeGrid',
    itemLabelKey: 'detail.episode',
  },
)
const emit = defineEmits<{ update: [number] }>()

const { translate, translatePlural } = useAppI18n()

const percent = computed(() =>
  props.total === 0 ? 0 : Math.min(100, Math.round((props.watched / props.total) * 100)),
)
const canAdvance = computed(() => props.watched < props.total)
const gridEpisodes = computed(() => Math.min(props.total, props.gridLimit))

function setWatched(value: number): void {
  const next = Math.min(props.total, Math.max(0, value))
  if (next !== props.watched) emit('update', next)
}

function toggleEpisode(episodeNumber: number): void {
  // Clicking an episode sets progress up to it, or back to the one before it.
  setWatched(episodeNumber <= props.watched ? episodeNumber - 1 : episodeNumber)
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
          :disabled="props.watched === 0 || props.isBusy"
          aria-label="-1"
          @click="setWatched(props.watched - 1)"
        >
          <i class="pi pi-minus text-xs" />
        </button>
        <span class="min-w-20 text-center text-sm tabular-nums">
          {{ translate('detail.watchedOfTotal', { watched: props.watched, total: props.total }) }}
        </span>
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
          :disabled="!canAdvance || props.isBusy"
          aria-label="+1"
          @click="setWatched(props.watched + 1)"
        >
          <i class="pi pi-plus text-xs" />
        </button>
      </div>

      <button
        type="button"
        class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        :disabled="!canAdvance || props.isBusy"
        @click="setWatched(props.watched + 1)"
      >
        {{ props.isBusy ? translate('detail.saving') : translate(props.nextLabelKey) }}
      </button>
    </div>

    <div
      class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      role="progressbar"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="translate('detail.progress')"
    >
      <div
        class="h-full rounded-full bg-brand-600 transition-all"
        :style="{ width: `${percent}%` }"
      />
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400">
      {{ percent }}% · {{ translatePlural(props.pluralKey, props.total) }}
    </p>

    <fieldset class="flex flex-col gap-1">
      <legend class="pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {{ translate(props.gridLabelKey) }}
      </legend>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="episode in gridEpisodes"
          :key="episode"
          type="button"
          class="size-8 rounded border text-xs tabular-nums transition-colors"
          :class="episode <= props.watched
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-gray-200 text-gray-500 hover:border-brand-400 dark:border-gray-700 dark:text-gray-400'"
          :aria-pressed="episode <= props.watched"
          :aria-label="translate(props.itemLabelKey, { number: episode })"
          :disabled="props.isBusy"
          @click="toggleEpisode(episode)"
        >
          {{ episode }}
        </button>
      </div>
    </fieldset>
  </section>
</template>
