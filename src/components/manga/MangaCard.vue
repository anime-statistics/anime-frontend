<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { computed, ref } from 'vue'
import type { IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import { useAppI18n } from '@/composables/useAppI18n'
import { usePrefetchRoute } from '@/composables/usePrefetchRoute'
import { primaryTitle, secondaryTitle } from '@/core/utils/mediaTitle'

const props = withDefaults(
  defineProps<{ manga: IMangaSearchResultDto, selected?: boolean, selectable?: boolean }>(),
  { selected: false, selectable: false },
)

const emit = defineEmits<{
  toggleSelect: [string]
  openMenu: [{ mediaId: string, source: string, x: number, y: number }]
}>()

const { translate, translatePlural, locale } = useAppI18n()
const { prefetch } = usePrefetchRoute()
const hasImageError = ref(false)

const displayTitle = computed(() => primaryTitle(props.manga, locale.value))
const altTitle = computed(() => secondaryTitle(props.manga, locale.value))

function onContextMenu(event: MouseEvent): void {
  emit('openMenu', {
    mediaId: props.manga.id,
    source: props.manga.source,
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
    @pointerenter="prefetch('manga-detail')"
  >
    <template #header>
      <div class="relative">
        <img
          v-if="props.manga.imageUrl && !hasImageError"
          :src="props.manga.imageUrl"
          :alt="props.manga.title"
          class="h-40 w-full rounded-t-lg bg-gray-200 object-cover sm:h-48 dark:bg-gray-700"
          loading="lazy"
          decoding="async"
          @error="hasImageError = true"
        >
        <div
          v-else
          class="flex h-40 w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-brand-100 to-brand-300 sm:h-48 dark:from-gray-800 dark:to-gray-700"
        >
          <i class="pi pi-book text-3xl text-brand-500 dark:text-gray-500" />
        </div>

        <label
          v-if="props.selectable"
          class="absolute left-0 top-0 flex size-11 cursor-pointer items-center justify-center"
        >
          <span class="flex size-7 items-center justify-center rounded bg-white/90 dark:bg-gray-900/90">
            <input
              type="checkbox"
              class="accent-brand-600"
              :checked="props.selected"
              :aria-label="props.manga.title"
              @change="emit('toggleSelect', props.manga.id)"
            >
          </span>
        </label>
      </div>
    </template>

    <template #title>
      <RouterLink
        :to="{ name: 'manga-detail', params: { id: props.manga.id } }"
        class="block hover:text-brand-600 dark:hover:text-brand-300"
      >
        <span class="line-clamp-2 text-sm font-semibold sm:text-base">{{ displayTitle }}</span>
        <span
          v-if="altTitle"
          class="mt-0.5 line-clamp-1 text-xs font-normal text-gray-500 dark:text-gray-400"
        >
          {{ altTitle }}
        </span>
      </RouterLink>
    </template>

    <template #subtitle>
      <div class="flex flex-wrap items-center gap-1">
        <Tag
          :value="props.manga.source"
          severity="info"
        />
        <Tag
          :value="translate(`manga.status.${props.manga.status}`)"
          severity="contrast"
        />
      </div>
    </template>

    <template #content>
      <div class="flex items-center justify-between text-xs text-gray-500 sm:text-sm dark:text-gray-400">
        <span>{{ translatePlural('manga.chapters', props.manga.chaptersTotal) }}</span>
        <span v-if="props.manga.score">{{ props.manga.score }}/10</span>
      </div>

      <div
        v-if="props.manga.genres?.length"
        class="mt-2 flex flex-wrap gap-1"
      >
        <Tag
          v-for="genre in props.manga.genres.slice(0, 3)"
          :key="genre"
          :value="genre"
          severity="secondary"
        />
      </div>
    </template>
  </Card>
</template>
