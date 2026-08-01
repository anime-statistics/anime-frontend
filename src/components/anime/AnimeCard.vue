<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { computed, ref } from 'vue'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import type { ITagDto } from '@/apis/dtos/tagDto'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { usePrefetchRoute } from '@/composables/usePrefetchRoute'
import { primaryTitle, secondaryTitle } from '@/core/utils/mediaTitle'

const VISIBLE_TAGS = 3

const props = withDefaults(
  defineProps<{
    anime: IAnimeSearchResultDto
    tags?: ITagDto[]
    selected?: boolean
    selectable?: boolean
    compact?: boolean
  }>(),
  { tags: () => [], selected: false, selectable: false, compact: false },
)

const areAllTagsShown = ref(false)

const visibleTags = computed(() =>
  areAllTagsShown.value ? props.tags : props.tags.slice(0, VISIBLE_TAGS),
)
const hiddenTagCount = computed(() => Math.max(0, props.tags.length - VISIBLE_TAGS))

const emit = defineEmits<{
  toggleSelect: [string]
  openMenu: [{ mediaId: string, source: string, x: number, y: number }]
}>()

const { translate, translatePlural, locale } = useAppI18n()
const { prefetch } = usePrefetchRoute()
const hasImageError = ref(false)

const displayTitle = computed(() => primaryTitle(props.anime, locale.value))
const altTitle = computed(() => secondaryTitle(props.anime, locale.value))

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
    @pointerenter="prefetch('anime-detail')"
  >
    <template #header>
      <div class="relative">
        <img
          v-if="props.anime.imageUrl && !hasImageError"
          :src="props.anime.imageUrl"
          :alt="displayTitle"
          class="h-40 w-full rounded-t-lg bg-gray-200 object-cover sm:h-48 dark:bg-gray-700"
          loading="lazy"
          decoding="async"
          @error="hasImageError = true"
        >
        <div
          v-else
          class="flex h-40 w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-brand-100 to-brand-300 sm:h-48 dark:from-gray-800 dark:to-gray-700"
        >
          <i class="pi pi-image text-3xl text-brand-500 dark:text-gray-500" />
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
              :aria-label="displayTitle"
              @change="emit('toggleSelect', props.anime.id)"
            >
          </span>
        </label>
      </div>
    </template>

    <template #title>
      <RouterLink
        :to="{ name: 'anime-detail', params: { id: props.anime.id } }"
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
          :value="props.anime.source"
          severity="info"
        />
        <Tag
          v-if="props.anime.secondarySource"
          :value="props.anime.secondarySource"
          severity="secondary"
        />
      </div>
    </template>

    <template #content>
      <div class="flex items-center justify-between text-xs text-gray-500 sm:text-sm dark:text-gray-400">
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

      <div
        v-if="props.tags.length"
        class="mt-2 flex flex-wrap items-center gap-1"
      >
        <TagBadge
          v-for="tag in visibleTags"
          :key="tag.id"
          :tag="tag"
          size="sm"
        />
        <button
          v-if="hiddenTagCount > 0 && !areAllTagsShown"
          type="button"
          class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-200"
          @click.stop.prevent="areAllTagsShown = true"
        >
          {{ translate('tags.more', { count: hiddenTagCount }) }}
        </button>
      </div>
    </template>
  </Card>
</template>
