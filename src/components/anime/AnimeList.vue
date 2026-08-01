<script setup lang="ts">
import Tag from 'primevue/tag'
import { ref } from 'vue'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { primaryTitle, secondaryTitle } from '@/core/utils/mediaTitle'
import { useTagStore } from '@/stores/useTagStore'

const props = withDefaults(
  defineProps<{
    items: IAnimeSearchResultDto[]
    selectedIds?: Set<string>
    selectable?: boolean
  }>(),
  { selectedIds: () => new Set<string>(), selectable: false },
)

const emit = defineEmits<{
  toggleSelect: [string]
  openMenu: [{ mediaId: string, source: string, x: number, y: number }]
}>()

const { translatePlural, locale } = useAppI18n()
const tagStore = useTagStore()
const brokenImages = ref<Set<string>>(new Set())

function displayTitle(item: IAnimeSearchResultDto): string {
  return primaryTitle(item, locale.value)
}

function altTitle(item: IAnimeSearchResultDto): string | undefined {
  return secondaryTitle(item, locale.value)
}

function markBroken(id: string): void {
  brokenImages.value = new Set(brokenImages.value).add(id)
}

function onContextMenu(event: MouseEvent, item: IAnimeSearchResultDto): void {
  emit('openMenu', { mediaId: item.id, source: item.source, x: event.clientX, y: event.clientY })
}
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="item in props.items"
      :key="item.id"
      class="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:border-brand-400"
      :class="props.selectedIds.has(item.id)
        ? 'border-brand-500 bg-brand-50 dark:bg-gray-800'
        : 'border-gray-200 dark:border-gray-700'"
      @contextmenu.prevent="onContextMenu($event, item)"
    >
      <label
        v-if="props.selectable"
        class="-m-2 flex size-11 shrink-0 cursor-pointer items-center justify-center"
      >
        <input
          type="checkbox"
          class="accent-brand-600"
          :checked="props.selectedIds.has(item.id)"
          :aria-label="displayTitle(item)"
          @change="emit('toggleSelect', item.id)"
        >
      </label>

      <img
        v-if="item.imageUrl && !brokenImages.has(item.id)"
        :src="item.imageUrl"
        :alt="displayTitle(item)"
        class="size-14 shrink-0 rounded bg-gray-200 object-cover dark:bg-gray-700"
        loading="lazy"
        decoding="async"
        @error="markBroken(item.id)"
      >
      <div
        v-else
        class="flex size-14 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-800"
      >
        <i class="pi pi-image text-gray-400" />
      </div>

      <div class="min-w-0 flex-1">
        <RouterLink
          :to="{ name: 'anime-detail', params: { id: item.id } }"
          class="block truncate font-medium text-gray-900 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-300"
        >
          {{ displayTitle(item) }}
        </RouterLink>
        <p
          v-if="altTitle(item)"
          class="truncate text-xs text-gray-400 dark:text-gray-500"
        >
          {{ altTitle(item) }}
        </p>
        <p class="truncate text-xs text-gray-500 dark:text-gray-400">
          {{ translatePlural('anime.episodes', item.episodesTotal) }}
          <template v-if="item.score">
            · {{ item.score }}/10
          </template>
        </p>
        <div
          v-if="item.myTags.length"
          class="mt-1 flex flex-wrap items-center gap-1"
        >
          <TagBadge
            v-for="tag in tagStore.resolveTags(item.myTags)"
            :key="tag.id"
            :tag="tag"
            size="sm"
          />
        </div>
      </div>

      <div class="hidden shrink-0 items-center gap-1 sm:flex">
        <Tag
          :value="item.source"
          severity="info"
        />
        <Tag
          v-if="item.secondarySource"
          :value="item.secondarySource"
          severity="secondary"
        />
      </div>
    </li>
  </ul>
</template>
