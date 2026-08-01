<script setup lang="ts">
import { useSwipe } from '@vueuse/core'
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ITagDto } from '@/apis/dtos/tagDto'
import TagBadge from '@/components/common/TagBadge.vue'
import AnimeCard from '@/components/anime/AnimeCard.vue'
import AnimeCardSkeleton from '@/components/anime/AnimeCardSkeleton.vue'
import AnimeList from '@/components/anime/AnimeList.vue'
import BulkActionBar, { type IBulkTagAction } from '@/components/anime/BulkActionBar.vue'
import type { ITagMovePayload } from '@/components/anime/AnimeKanban.vue'
import SortSelector from '@/components/anime/SortSelector.vue'
import ColumnSlider from '@/components/common/ColumnSlider.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import MediaContextMenu, { type IContextMenuTarget } from '@/components/common/MediaContextMenu.vue'
import Pagination from '@/components/common/Pagination.vue'
import ViewModeToggle from '@/components/common/ViewModeToggle.vue'
import MangaCard from '@/components/manga/MangaCard.vue'
import MangaList from '@/components/manga/MangaList.vue'
import { useAnimeBulkTagMutation, useAnimeLibrary } from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import { useHaptic } from '@/composables/useHaptic'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useMangaLibrary } from '@/composables/useMangaQueries'
import { useIsMobile } from '@/composables/useMediaQuery'
import { useMediaSort } from '@/composables/useMediaSort'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { useMaxColumns } from '@/composables/useResponsiveColumns'
import { vReveal } from '@/composables/useReveal'
import { useToast } from '@/composables/useToast'
import { useUrlFilters } from '@/composables/useUrlFilters'
import { useAnimeStore } from '@/stores/useAnimeStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTagStore } from '@/stores/useTagStore'
import type { IViewMode } from '@/types/settings'

const SKELETON_COUNT = 8
const SWIPE_THRESHOLD_PX = 80

// Only one view mode renders at a time, and cards are the default. Keeping the
// table, kanban and their PrimeVue/drag-and-drop dependencies behind async
// boundaries takes them off the first-paint path.
const AnimeTable = defineAsyncComponent(() => import('@/components/anime/AnimeTable.vue'))
const AnimeKanban = defineAsyncComponent(() => import('@/components/anime/AnimeKanban.vue'))
const MangaTable = defineAsyncComponent(() => import('@/components/manga/MangaTable.vue'))

const route = useRoute()
const router = useRouter()
const { translate, translatePlural } = useAppI18n()
const animeStore = useAnimeStore()
const settingsStore = useSettingsStore()
const tagStore = useTagStore()
const isMobile = useIsMobile()
const maxColumns = useMaxColumns()
const haptic = useHaptic()
const toast = useToast()
const bulkTagMutation = useAnimeBulkTagMutation()

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

const selectedAnime = computed(() =>
  sortedAnime.value.filter((item) => animeStore.isSelected(item.id)),
)

// The bulk bar hides the entries that would do nothing: the union is what can
// still be stripped, the intersection is what there is no point adding.
const selectedTagIds = computed(() =>
  [...new Set(selectedAnime.value.flatMap((item) => item.myTags))],
)
const commonTagIds = computed(() =>
  selectedTagIds.value.filter((tagId) =>
    selectedAnime.value.every((item) => item.myTags.includes(tagId)),
  ),
)
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
  get: () => Math.min(settingsStore.columns, maxColumns.value),
  set: (value) => settingsStore.setColumns(value),
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
}))

const { filters: urlFilters, setFilters } = useUrlFilters({
  defaultSize: settingsStore.settings.pageSize,
})

const paginationMode = computed(() => settingsStore.settings.paginationMode)
// Kanban shows every column at once; the table paginates itself.
const isPaged = computed(() => viewMode.value === 'cards' || viewMode.value === 'list')

const pagedAnime = computed(() => {
  if (!isPaged.value || paginationMode.value !== 'pagination') return sortedAnime.value
  const start = (urlFilters.value.page - 1) * urlFilters.value.size
  return sortedAnime.value.slice(start, start + urlFilters.value.size)
})

const pagedManga = computed(() => {
  if (!isPaged.value || paginationMode.value !== 'pagination') return sortedManga.value
  const start = (urlFilters.value.page - 1) * urlFilters.value.size
  return sortedManga.value.slice(start, start + urlFilters.value.size)
})

const infiniteAnime = useInfiniteScroll((page) => {
  const size = urlFilters.value.size
  const slice = sortedAnime.value.slice((page - 1) * size, page * size)
  return Promise.resolve({ items: slice, hasMore: page * size < sortedAnime.value.length })
})

const infiniteManga = useInfiniteScroll((page) => {
  const size = urlFilters.value.size
  const slice = sortedManga.value.slice((page - 1) * size, page * size)
  return Promise.resolve({ items: slice, hasMore: page * size < sortedManga.value.length })
})

const isInfinite = computed(() => isPaged.value && paginationMode.value === 'infinite')

const visibleAnime = computed(() =>
  isInfinite.value ? infiniteAnime.items.value : pagedAnime.value,
)
const visibleManga = computed(() =>
  isInfinite.value ? infiniteManga.items.value : pagedManga.value,
)

// The source lists change with sorting, tag filters and mutations; the infinite
// accumulators must restart from page one when that happens.
watch(
  [sortedAnime, sortedManga, isInfinite],
  () => {
    if (!isInfinite.value) return
    void infiniteAnime.reset()
    void infiniteManga.reset()
  },
  { immediate: true },
)

function onPageChange(change: { page: number, size: number }): void {
  setFilters({ page: change.page, size: change.size })
}

watch(mediaType, () => {
  if (urlFilters.value.page !== 1) setFilters({ page: 1 })
})

const swipeArea = ref<HTMLElement | null>(null)

function switchMediaType(next: 'anime' | 'manga'): void {
  if (mediaType.value === next) return
  haptic.lightTap()
  void router.push({ name: 'home', query: { ...route.query, type: next, page: undefined } })
}

useSwipe(swipeArea, {
  threshold: SWIPE_THRESHOLD_PX,
  onSwipeEnd: (_event, direction) => {
    if (!isMobile.value) return
    if (direction === 'left') switchMediaType('manga')
    if (direction === 'right') switchMediaType('anime')
  },
})

async function refreshLibrary(): Promise<void> {
  haptic.mediumTap()
  await (mediaType.value === 'manga' ? mangaLibrary.refetch() : animeLibrary.refetch())
}

const pullToRefresh = usePullToRefresh(refreshLibrary)

const contextTarget = ref<IContextMenuTarget | null>(null)

function openMenu(target: IContextMenuTarget): void {
  contextTarget.value = target
}

async function applyTags(action: IBulkTagAction): Promise<void> {
  const ids = [...animeStore.selectedIds]
  if (ids.length === 0) return

  const updated = await bulkTagMutation.mutateAsync({ ids, ...action })
  toast.success(translate('bulk.applied', { count: updated }))
  animeStore.clearSelection()
}

// Dragging a card across the board swaps one column tag for another; tags that
// are not columns are left alone.
async function onKanbanTagMove(payload: ITagMovePayload): Promise<void> {
  await bulkTagMutation.mutateAsync({
    ids: [payload.mediaId],
    add: payload.addTagId ? [payload.addTagId] : undefined,
    remove: payload.removeTagId ? [payload.removeTagId] : undefined,
  })
}

function openTagEditor(mediaId: string): void {
  contextTarget.value = null
  const name = mediaType.value === 'manga' ? 'manga-detail' : 'anime-detail'
  void router.push({ name, params: { id: mediaId } })
}

function onKeydown(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'a') return
  if (mediaType.value !== 'anime') return

  event.preventDefault()
  animeStore.selectAll(visibleAnime.value.map((item) => item.id))
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section
    ref="swipeArea"
    class="flex flex-col gap-4 overscroll-y-contain"
    @touchstart.passive="pullToRefresh.onTouchStart"
    @touchmove.passive="pullToRefresh.onTouchMove"
    @touchend.passive="pullToRefresh.onTouchEnd"
  >
    <div
      v-if="pullToRefresh.pullDistance.value > 0"
      class="pointer-events-none -mb-4 flex items-end justify-center overflow-hidden md:hidden"
      :style="{ height: `${pullToRefresh.pullDistance.value}px` }"
      role="status"
      :aria-label="translate('mobile.pullToRefresh')"
    >
      <LoadingSpinner
        v-if="pullToRefresh.isRefreshing.value"
        size="sm"
      />
      <i
        v-else
        class="pi pi-arrow-down text-brand-600 transition-transform dark:text-brand-300"
        :style="{ transform: `rotate(${pullToRefresh.progress.value * 180}deg)` }"
      />
    </div>

    <!-- The header's anime/manga switch is desktop-only, so the swipe gesture
         needs a tappable twin here. -->
    <div
      class="flex items-center gap-1 rounded-lg bg-gray-100 p-1 sm:hidden dark:bg-gray-800"
      role="tablist"
      :aria-label="translate('nav.bottomBar')"
    >
      <button
        v-for="kind in (['anime', 'manga'] as const)"
        :key="kind"
        type="button"
        role="tab"
        class="min-h-[44px] flex-1 rounded-md px-3 text-sm transition-colors"
        :class="mediaType === kind
          ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-300'
          : 'text-gray-600 dark:text-gray-400'"
        :aria-selected="mediaType === kind"
        @click="switchMediaType(kind)"
      >
        {{ translate(`nav.${kind}`) }}
      </button>
    </div>

    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ translate('pages.homeTitle') }}
        </h1>
        <p class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{{ translatePlural('pagination.results', itemCount) }}</span>
          <template v-if="activeTag">
            <RouterLink
              :to="{ name: 'tag-detail', params: { id: activeTag.id } }"
              :title="translate('tags.openPage')"
            >
              <TagBadge
                :tag="activeTag"
                size="sm"
              />
            </RouterLink>
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
          :max="maxColumns"
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
        @tag-move="onKanbanTagMove"
      />

      <AnimeTable
        v-else-if="viewMode === 'table'"
        :items="sortedAnime"
      />

      <AnimeList
        v-else-if="viewMode === 'list'"
        :items="visibleAnime"
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
          v-for="item in visibleAnime"
          :key="item.id"
          v-memo="[
            item.id,
            item.score,
            item.myTags,
            tagStore.tags,
            animeStore.isSelected(item.id),
          ]"
          v-reveal
          :anime="item"
          :tags="tagsFor(item)"
          selectable
          :selected="animeStore.isSelected(item.id)"
          @toggle-select="animeStore.toggleSelection"
          @open-menu="openMenu"
        />
      </div>

      <template v-if="isPaged">
        <Pagination
          v-if="paginationMode === 'pagination'"
          :page="urlFilters.page"
          :size="urlFilters.size"
          :total="sortedAnime.length"
          @change="onPageChange"
        />
        <div
          v-else
          :ref="(el) => { infiniteAnime.sentinel.value = el as HTMLElement | null }"
          class="flex justify-center py-4"
        >
          <LoadingSpinner
            v-if="infiniteAnime.isLoading.value"
            size="sm"
          />
        </div>
      </template>

      <BulkActionBar
        :selected-count="animeStore.selectedCount"
        :selected-tag-ids="selectedTagIds"
        :common-tag-ids="commonTagIds"
        :is-busy="bulkTagMutation.isPending.value"
        @apply-tags="applyTags"
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
        :items="visibleManga"
      />

      <div
        v-else
        class="grid gap-4"
        :style="gridStyle"
      >
        <MangaCard
          v-for="item in visibleManga"
          :key="item.id"
          v-memo="[item.id, item.score, item.myTags, tagStore.tags]"
          v-reveal
          :manga="item"
          @open-menu="openMenu"
        />
      </div>

      <template v-if="isPaged">
        <Pagination
          v-if="paginationMode === 'pagination'"
          :page="urlFilters.page"
          :size="urlFilters.size"
          :total="sortedManga.length"
          @change="onPageChange"
        />
        <div
          v-else
          :ref="(el) => { infiniteManga.sentinel.value = el as HTMLElement | null }"
          class="flex justify-center py-4"
        >
          <LoadingSpinner
            v-if="infiniteManga.isLoading.value"
            size="sm"
          />
        </div>
      </template>
    </template>

    <MediaContextMenu
      :target="contextTarget"
      :kind="mediaType"
      @close="contextTarget = null"
      @edit-tags="openTagEditor"
    />
  </section>
</template>
