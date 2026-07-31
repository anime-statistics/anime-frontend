<script setup lang="ts">
import Tag from 'primevue/tag'
import { ref } from 'vue'
import type { IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import { useAppI18n } from '@/composables/useAppI18n'

const props = defineProps<{ items: IMangaSearchResultDto[] }>()

const { translate, translatePlural } = useAppI18n()
const brokenImages = ref<Set<string>>(new Set())

function markBroken(id: string): void {
  brokenImages.value = new Set(brokenImages.value).add(id)
}
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="item in props.items"
      :key="item.id"
      class="flex items-center gap-3 rounded-lg border border-gray-200 p-2 transition-colors hover:border-brand-400 dark:border-gray-700"
    >
      <img
        v-if="item.imageUrl && !brokenImages.has(item.id)"
        :src="item.imageUrl"
        :alt="item.title"
        class="size-14 shrink-0 rounded object-cover"
        loading="lazy"
        @error="markBroken(item.id)"
      >
      <div
        v-else
        class="flex size-14 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-800"
      >
        <i class="pi pi-book text-gray-400" />
      </div>

      <div class="min-w-0 flex-1">
        <RouterLink
          :to="{ name: 'manga-detail', params: { id: item.id } }"
          class="block truncate font-medium text-gray-900 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-300"
        >
          {{ item.title }}
        </RouterLink>
        <p class="truncate text-xs text-gray-500 dark:text-gray-400">
          {{ translatePlural('manga.volumes', item.volumesTotal) }}
          · {{ translatePlural('manga.chapters', item.chaptersTotal) }}
          · {{ translate(`manga.status.${item.status}`) }}
        </p>
      </div>

      <Tag
        :value="item.source"
        severity="info"
        class="hidden shrink-0 sm:inline-flex"
      />
    </li>
  </ul>
</template>
