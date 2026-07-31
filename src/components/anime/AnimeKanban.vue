<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { AnimeStatus } from '@/apis/dtos/animeDto'
import AnimeCard from '@/components/anime/AnimeCard.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import type { IMergedAnimeSearchResult } from '@/mocks/mediaAdapter'

const props = defineProps<{ items: IMergedAnimeSearchResult[] }>()
const emit = defineEmits<{ statusChange: [{ mediaId: string, status: AnimeStatus }] }>()

const { translate } = useAppI18n()

const KANBAN_STATUSES = ['watching', 'planned', 'completed', 'on_hold', 'dropped'] as const
type KanbanStatus = (typeof KANBAN_STATUSES)[number]

const columns = ref<Record<KanbanStatus, IMergedAnimeSearchResult[]>>(groupByStatus(props.items))

function groupByStatus(
  items: IMergedAnimeSearchResult[],
): Record<KanbanStatus, IMergedAnimeSearchResult[]> {
  const grouped = Object.fromEntries(
    KANBAN_STATUSES.map((status) => [status, [] as IMergedAnimeSearchResult[]]),
  ) as Record<KanbanStatus, IMergedAnimeSearchResult[]>

  for (const item of items) {
    const status = KANBAN_STATUSES.find((known) => known === item.status)
    // Rewatching has no column of its own, so it rides along with "watching".
    grouped[status ?? 'watching'].push(item)
  }

  return grouped
}

watch(
  () => props.items,
  (items) => {
    columns.value = groupByStatus(items)
  },
)

function onAdd(status: KanbanStatus, event: { data: IMergedAnimeSearchResult }): void {
  emit('statusChange', { mediaId: event.data.id, status })
}
</script>

<template>
  <div class="flex gap-3 overflow-x-auto pb-2">
    <section
      v-for="status in KANBAN_STATUSES"
      :key="status"
      class="flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50"
    >
      <h3 class="flex items-center justify-between px-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {{ translate(`anime.status.${status}`) }}
        <span class="text-xs font-normal text-gray-500 dark:text-gray-400">
          {{ columns[status].length }}
        </span>
      </h3>

      <VueDraggable
        v-model="columns[status]"
        group="anime-kanban"
        :animation="150"
        item-key="id"
        class="flex min-h-24 flex-col gap-2 rounded-lg p-1 transition-colors"
        ghost-class="opacity-40"
        @add="onAdd(status, $event)"
      >
        <AnimeCard
          v-for="item in columns[status]"
          :key="item.id"
          :anime="item"
          compact
        />
      </VueDraggable>
    </section>
  </div>
</template>
