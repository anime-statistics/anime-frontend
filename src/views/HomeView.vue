<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { AnimeStatus } from '@/apis/dtos/animeDto'
import type { ITagDto } from '@/apis/dtos/tagDto'
import TagBadge from '@/components/common/TagBadge.vue'
import AnimeCard from '@/components/anime/AnimeCard.vue'
import AnimeCardSkeleton from '@/components/anime/AnimeCardSkeleton.vue'
import AnimeKanban from '@/components/anime/AnimeKanban.vue'
import AnimeList from '@/components/anime/AnimeList.vue'
import AnimeTable from '@/components/anime/AnimeTable.vue'
import BulkActionBar from '@/components/anime/BulkActionBar.vue'
import SortSelector from '@/components/anime/SortSelector.vue'
import ColumnSlider from '@/components/common/ColumnSlider.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MediaContextMenu, { type IContextMenuTarget } from '@/components/common/MediaContextMenu.vue'
import ViewModeToggle from '@/components/common/ViewModeToggle.vue'
import MangaCard from '@/components/manga/MangaCard.vue'
import MangaList from '@/components/manga/MangaList.vue'
import MangaTable from '@/components/manga/MangaTable.vue'
import { useAnimeLibrary, useAnimeStatusMutation } from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import { useMangaLibrary } from '@/composables/useMangaQueries'
import { useIsMobile } from '@/composables/useMediaQuery'
import { useMediaSort } from '@/composables/useMediaSort'
import { useToast } from '@/composables/useToast'
import { useAnimeStore } from '@/stores/useAnimeStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTagStore } from '@/stores/useTagStore'
import type { IViewMode } from '@/types/settings'

const MOBILE_MAX_COLUMNS = 2
const SKELETON_COUNT = 8

const route = useRoute()
const { translate, translatePlural } = useAppI18n()
const animeStore = useAnimeStore()
const settingsStore = useSettingsStore()
const tagStore = useTagStore()
const isMobile = useIsMobile()
const toast = useToast()
const statusMutation = useAnimeStatusMutation()

const mediaType = computed(() => (route.query.type === 'manga' ? 'manga' : 'anime'))

const animeLibrary = useAnimeLibrary()
const mangaLibrary = useMangaLibrary()

const animeItems = computed(() => animeLibrary.data.value?.items ?? [])
const mangaItems = computed(() => mangaLibrary.data.value?.items ?? [])

const { sortField, sortOrder, sorted: allSortedAnime, setSortField, setSortOrder }
  = useMediaSort(animeItems)
const { sorted: allSortedManga } = useMediaSort(mangaItems)

const activeTagId = computed(() =>
  typeof route.query.tag === 'string' ? route.query.tag : null,
)
const activeTag = computed(() => (activeTagId.value ? tagStore.findTag(activeTagId.value) : undefined))

function matchesActiveTag(item: { myTags?: string[] }): boolean {
  return !activeTagId.value || (item.myTags ?? []).includes(activeTagId.value)
}

const sortedAnime = computed(() => allSortedAnime.value.filter(matchesActiveTag))
const sortedManga = computed(() => allSortedManga.value.filter(matchesActiveTag))

function tagsFor(item: { myTags?: string[] }): ITagDto[] {
  return (item.myTags ?? [])
    .map((id) => tagStore.findTag(id))
    .filter((tag): tag is ITagDto => tag !== undefined)
}

const isPending = computed(() =>
  mediaType.value === 'manga' ? mangaLibrary.isPending.value : animeLibrary.isPending.value,
)
const itemCount = computed(() =>
  mediaType.value === 'manga' ? sortedManga.value.length : sortedAnime.value.length,
)

const viewMode = computed<IViewMode>({
  get: () => settingsStore.viewMode,
  set: (mode) => settingsStore.setViewMode(mode),
})

const columns = computed<number>({
  get: () => Math.min(settingsStore.columns, isMobile.value ? MOBILE_MAX_COLUMNS : 12),
  set: (value) => settingsStore.setColumns(value),
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
}))

const contextTarget = ref<IContextMenuTarget | null>(null)

function openMenu(target: IContextMenuTarget): void {
  contextTarget.value = target
}

async function applyStatus(status: AnimeStatus): Promise<void> {
  const ids = [...animeStore.selectedIds]
  await Promise.all(
    ids.map((mediaId) => statusMutation.mutateAsync({ mediaId, payload: { status } })),
  )
  toast.success(translate('bulk.applied', { count: ids.length }))
  animeStore.clearSelection()
}

async function onKanbanStatusChange(payload: {
  mediaId: string
  status: AnimeStatus
}): Promise<void> {
  await statusMutation.mutateAsync({
    mediaId: payload.mediaId,
    payload: { status: payload.status },
  })
}

function onKeydown(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'a') return
  if (mediaType.value !== 'anime') return

  event.preventDefault()
  animeStore.selectAll(sortedAnime.value.map((item) => item.id))
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="flex flex-col gap-4">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ translate('pages.homeTitle') }}
        </h1>
        <p class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{{ translatePlural('pagination.results', itemCount) }}</span>
          <template v-if="activeTag">
            <TagBadge
              :tag="activeTag"
              size="sm"
            />
            <RouterLink
              :to="{ name: 'home', query: { type: route.query.type } }"
              class="underline underline-offset-2"
            >
              {{ translate('tags.clearFilter') }}
            </RouterLink>
          </template>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <SortSelector
          :field="sortField"
          :order="sortOrder"
          @update:field="setSortField"
          @update:order="setSortOrder"
        />
        <ColumnSlider
          v-if="viewMode === 'cards'"
          v-model="columns"
          :max="isMobile ? MOBILE_MAX_COLUMNS : 12"
        />
        <ViewModeToggle v-model="viewMode" />
      </div>
    </header>

    <div
      v-if="isPending"
      class="grid gap-4"
      :style="gridStyle"
    >
      <AnimeCardSkeleton
        v-for="index in SKELETON_COUNT"
        :key="index"
      />
    </div>

    <EmptyState
      v-else-if="itemCount === 0"
      :show-reset="false"
    />

    <template v-else-if="mediaType === 'anime'">
      <AnimeKanban
        v-if="viewMode === 'kanban'"
        :items="sortedAnime"
        @status-change="onKanbanStatusChange"
      />

      <AnimeTable
        v-else-if="viewMode === 'table'"
        :items="sortedAnime"
      />

      <AnimeList
        v-else-if="viewMode === 'list'"
        :items="sortedAnime"
        :selected-ids="animeStore.selectedIds"
        selectable
        @toggle-select="animeStore.toggleSelection"
        @open-menu="openMenu"
      />

      <div
        v-else
        class="grid gap-4"
        :style="gridStyle"
      >
        <AnimeCard
          v-for="item in sortedAnime"
          :key="item.id"
          :anime="item"
          :tags="tagsFor(item)"
          selectable
          :selected="animeStore.isSelected(item.id)"
          @toggle-select="animeStore.toggleSelection"
          @open-menu="openMenu"
        />
      </div>

      <BulkActionBar
        :selected-count="animeStore.selectedCount"
        :is-busy="statusMutation.isPending.value"
        @change-status="applyStatus"
        @clear="animeStore.clearSelection()"
      />
    </template>

    <template v-else>
      <MangaTable
        v-if="viewMode === 'table'"
        :items="sortedManga"
      />

      <MangaList
        v-else-if="viewMode === 'list'"
        :items="sortedManga"
      />

      <div
        v-else
        class="grid gap-4"
        :style="gridStyle"
      >
        <MangaCard
          v-for="item in sortedManga"
          :key="item.id"
          :manga="item"
          @open-menu="openMenu"
        />
      </div>
    </template>

    <MediaContextMenu
      :target="contextTarget"
      :kind="mediaType"
      @close="contextTarget = null"
      @change-status="contextTarget = null"
    />
  </section>
</template>
