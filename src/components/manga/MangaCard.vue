<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { ref } from 'vue'
import type { IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import { useAppI18n } from '@/composables/useAppI18n'

const props = withDefaults(
  defineProps<{ manga: IMangaSearchResultDto, selected?: boolean, selectable?: boolean }>(),
  { selected: false, selectable: false },
)

const emit = defineEmits<{
  toggleSelect: [string]
  openMenu: [{ mediaId: string, source: string, x: number, y: number }]
}>()

const { translate, translatePlural } = useAppI18n()
const hasImageError = ref(false)

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
  >
    <template #header>
      <div class="relative">
        <img
          v-if="props.manga.imageUrl && !hasImageError"
          :src="props.manga.imageUrl"
          :alt="props.manga.title"
          class="h-48 w-full rounded-t-lg object-cover"
          loading="lazy"
          @error="hasImageError = true"
        >
        <div
          v-else
          class="flex h-48 w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-brand-100 to-brand-300 dark:from-gray-800 dark:to-gray-700"
        >
          <i class="pi pi-book text-3xl text-brand-500 dark:text-gray-500" />
        </div>

        <label
          v-if="props.selectable"
          class="absolute left-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded bg-white/90 dark:bg-gray-900/90"
        >
          <input
            type="checkbox"
            class="accent-brand-600"
            :checked="props.selected"
            :aria-label="props.manga.title"
            @change="emit('toggleSelect', props.manga.id)"
          >
        </label>
      </div>
    </template>

    <template #title>
      <RouterLink
        :to="{ name: 'manga-detail', params: { id: props.manga.id } }"
        class="line-clamp-2 text-base font-semibold hover:text-brand-600 dark:hover:text-brand-300"
      >
        {{ props.manga.title }}
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
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
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
