<script lang="ts">
export interface ITagMovePayload {
  mediaId: string
  removeTagId?: string
  addTagId?: string
}
</script>

<script setup lang="ts">
import MultiSelect from 'primevue/multiselect'
import { computed, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { IAnimeSearchResultDto } from '@/apis/dtos/animeDto'
import type { ITagDto } from '@/apis/dtos/tagDto'
import AnimeCard from '@/components/anime/AnimeCard.vue'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useHaptic } from '@/composables/useHaptic'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTagStore } from '@/stores/useTagStore'

// The column that catches everything the chosen tags do not.
const REST_COLUMN = ''

const props = defineProps<{ items: IAnimeSearchResultDto[] }>()
const emit = defineEmits<{ tagMove: [ITagMovePayload] }>()

const { translate } = useAppI18n()
const haptic = useHaptic()
const tagStore = useTagStore()
const settingsStore = useSettingsStore()

const columnTags = computed<ITagDto[]>(() =>
  tagStore.resolveTags(settingsStore.settings.kanbanTagIds),
)
const columnIds = computed(() => [...columnTags.value.map((tag) => tag.id), REST_COLUMN])

// The outer draggable needs a mutable list, so the settings order is mirrored
// here and written back once a column drop lands.
const orderedTags = ref<ITagDto[]>([])
watch(columnTags, (tags) => {
  orderedTags.value = [...tags]
}, { immediate: true })

function onColumnReorder(): void {
  haptic.lightTap()
  settingsStore.update({ kanbanTagIds: orderedTags.value.map((tag) => tag.id) })
  settingsStore.persist()
}

const selectedTagIds = computed<string[]>({
  get: () => settingsStore.settings.kanbanTagIds,
  set: (ids) => {
    settingsStore.update({ kanbanTagIds: ids })
    settingsStore.persist()
  },
})

// A title can hold several column tags at once; it is shown in the first one so
// dragging stays unambiguous.
function columnOf(item: IAnimeSearchResultDto): string {
  return columnTags.value.find((tag) => item.myTags.includes(tag.id))?.id ?? REST_COLUMN
}

function group(items: IAnimeSearchResultDto[]): Record<string, IAnimeSearchResultDto[]> {
  const grouped = Object.fromEntries(
    columnIds.value.map((id) => [id, [] as IAnimeSearchResultDto[]]),
  )

  for (const item of items) grouped[columnOf(item)].push(item)
  return grouped
}

const columns = ref<Record<string, IAnimeSearchResultDto[]>>(group(props.items))

watch(
  [() => props.items, columnIds],
  () => {
    columns.value = group(props.items)
  },
  { immediate: true },
)

function labelOf(tagId: string): string {
  return tagStore.findTag(tagId)?.name ?? translate('tags.untagged')
}

function onAdd(targetId: string, event: { data: IAnimeSearchResultDto }): void {
  haptic.success()

  const removeTagId = columnTags.value.find((tag) => event.data.myTags.includes(tag.id))?.id
  emit('tagMove', {
    mediaId: event.data.id,
    removeTagId,
    addTagId: targetId === REST_COLUMN ? undefined : targetId,
  })
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <label class="flex flex-wrap items-center gap-2 text-sm">
      <span class="text-gray-500 dark:text-gray-400">{{ translate('kanban.columns') }}</span>
      <MultiSelect
        v-model="selectedTagIds"
        :options="tagStore.tags"
        option-label="name"
        option-value="id"
        filter
        display="chip"
        class="min-w-64 max-w-full"
        :placeholder="translate('kanban.pickColumns')"
        :aria-label="translate('kanban.columns')"
      >
        <template #option="{ option }">
          <TagBadge
            :tag="option"
            size="sm"
          />
        </template>
      </MultiSelect>
    </label>

    <p
      v-if="columnTags.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('kanban.empty') }}
    </p>

    <div class="flex gap-3 overflow-x-auto pb-2">
      <!-- Tag columns can swap places by their grip; the catch-all column is not
           a tag, so it sits outside the draggable and always stays last. -->
      <VueDraggable
        v-model="orderedTags"
        :animation="150"
        handle=".kanban-column-grip"
        ghost-class="opacity-40"
        class="flex gap-3"
        @update="onColumnReorder"
      >
        <section
          v-for="tag in orderedTags"
          :key="tag.id"
          class="flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50"
        >
          <h3 class="flex items-center justify-between gap-2 px-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <span class="flex min-w-0 items-center gap-1.5">
              <button
                type="button"
                class="kanban-column-grip cursor-grab touch-none text-gray-400 transition-colors hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:text-gray-300"
                :title="translate('kanban.reorder')"
                :aria-label="translate('kanban.reorder')"
              >
                <i class="pi pi-bars" />
              </button>
              <TagBadge
                :tag="tag"
                size="sm"
              />
            </span>
            <span class="text-xs font-normal text-gray-500 dark:text-gray-400">
              {{ columns[tag.id]?.length ?? 0 }}
            </span>
          </h3>

          <VueDraggable
            v-model="columns[tag.id]"
            group="anime-kanban"
            :animation="150"
            item-key="id"
            class="flex min-h-24 flex-col gap-2 rounded-lg p-1 transition-colors"
            ghost-class="opacity-40"
            @add="onAdd(tag.id, $event)"
          >
            <AnimeCard
              v-for="item in columns[tag.id]"
              :key="item.id"
              :anime="item"
              :tags="tagStore.resolveTags(item.myTags)"
              compact
            />
          </VueDraggable>
        </section>
      </VueDraggable>

      <section class="flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
        <h3 class="flex items-center justify-between gap-2 px-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <span>{{ labelOf(REST_COLUMN) }}</span>
          <span class="text-xs font-normal text-gray-500 dark:text-gray-400">
            {{ columns[REST_COLUMN]?.length ?? 0 }}
          </span>
        </h3>

        <VueDraggable
          v-model="columns[REST_COLUMN]"
          group="anime-kanban"
          :animation="150"
          item-key="id"
          class="flex min-h-24 flex-col gap-2 rounded-lg p-1 transition-colors"
          ghost-class="opacity-40"
          @add="onAdd(REST_COLUMN, $event)"
        >
          <AnimeCard
            v-for="item in columns[REST_COLUMN]"
            :key="item.id"
            :anime="item"
            :tags="tagStore.resolveTags(item.myTags)"
            compact
          />
        </VueDraggable>
      </section>
    </div>
  </div>
</template>
