<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { ref } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import type { IMergedAnimeSearchResult } from '@/mocks/mediaAdapter'

const props = withDefaults(
  defineProps<{
    anime: IMergedAnimeSearchResult
    selected?: boolean
    selectable?: boolean
    compact?: boolean
  }>(),
  { selected: false, selectable: false, compact: false },
)

const emit = defineEmits<{
  toggleSelect: [string]
  openMenu: [{ mediaId: string, source: string, x: number, y: number }]
}>()

const { translate, translatePlural } = useAppI18n()
const hasImageError = ref(false)

function onContextMenu(event: MouseEvent): void {
  emit('openMenu', {
    mediaId: props.anime.id,
    source: props.anime.source,
    x: event.clientX,
    y: event.clientY,
  })
}
</script>

<template>
  <Card
    class="relative h-full overflow-hidden transition-shadow hover:shadow-lg"
    :class="props.selected ? 'ring-2 ring-brand-500' : ''"
    @contextmenu.prevent="onContextMenu"
  >
    <template #header>
      <div class="relative">
        <img
          v-if="props.anime.imageUrl && !hasImageError"
          :src="props.anime.imageUrl"
          :alt="props.anime.title"
          class="h-48 w-full rounded-t-lg object-cover"
          loading="lazy"
          @error="hasImageError = true"
        >
        <div
          v-else
          class="flex h-48 w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-brand-100 to-brand-300 dark:from-gray-800 dark:to-gray-700"
        >
          <i class="pi pi-image text-3xl text-brand-500 dark:text-gray-500" />
        </div>

        <label
          v-if="props.selectable"
          class="absolute left-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded bg-white/90 dark:bg-gray-900/90"
        >
          <input
            type="checkbox"
            class="accent-brand-600"
            :checked="props.selected"
            :aria-label="props.anime.title"
            @change="emit('toggleSelect', props.anime.id)"
          >
        </label>
      </div>
    </template>

    <template #title>
      <RouterLink
        :to="{ name: 'anime-detail', params: { id: props.anime.id } }"
        class="line-clamp-2 text-base font-semibold hover:text-brand-600 dark:hover:text-brand-300"
      >
        {{ props.anime.title }}
      </RouterLink>
    </template>

    <template #subtitle>
      <div class="flex flex-wrap items-center gap-1">
        <Tag
          :value="props.anime.source"
          severity="info"
        />
        <Tag
          v-if="props.anime.secondarySource"
          :value="props.anime.secondarySource"
          severity="secondary"
        />
        <Tag
          :value="translate(`anime.status.${props.anime.status}`)"
          severity="contrast"
        />
      </div>
    </template>

    <template #content>
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{{ translatePlural('anime.episodes', props.anime.episodesTotal) }}</span>
        <span v-if="props.anime.score">{{ props.anime.score }}/10</span>
      </div>

      <div
        v-if="!props.compact && props.anime.genres?.length"
        class="mt-2 flex flex-wrap gap-1"
      >
        <Tag
          v-for="genre in props.anime.genres.slice(0, 3)"
          :key="genre"
          :value="genre"
          severity="secondary"
        />
      </div>
    </template>
  </Card>
</template>
