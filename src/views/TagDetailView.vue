<script setup lang="ts">
import Select from 'primevue/select'
import { computed, onMounted, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import type { ICreateTagDto } from '@/apis/dtos/tagDto'
import AnimeList from '@/components/anime/AnimeList.vue'
import MangaList from '@/components/manga/MangaList.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TagBadge from '@/components/common/TagBadge.vue'
import TagDeleteDialog, { type TagDeleteMode } from '@/components/common/TagDeleteDialog.vue'
import TagFormDialog from '@/components/common/TagFormDialog.vue'
import { useAnimeBulkTagMutation, useAnimeLibrary } from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import { useMangaBulkTagMutation, useMangaLibrary } from '@/composables/useMangaQueries'
import { useToast } from '@/composables/useToast'
import { useTagStore } from '@/stores/useTagStore'

const props = defineProps<{ id: string }>()

const tagId = toRef(props, 'id')
const router = useRouter()
const { translate, translatePlural } = useAppI18n()
const tagStore = useTagStore()
const toast = useToast()

const animeLibrary = useAnimeLibrary()
const mangaLibrary = useMangaLibrary()
const animeBulk = useAnimeBulkTagMutation()
const mangaBulk = useMangaBulkTagMutation()

const selectedIds = ref<Set<string>>(new Set())
const moveTargetId = ref<string | null>(null)
const isEditOpen = ref(false)
const isDeleteOpen = ref(false)

const tag = computed(() => tagStore.findTag(tagId.value))

const animeItems = computed(() =>
  (animeLibrary.data.value?.items ?? []).filter((item) => item.myTags.includes(tagId.value)),
)
const mangaItems = computed(() =>
  (mangaLibrary.data.value?.items ?? []).filter((item) => item.myTags.includes(tagId.value)),
)

const itemCount = computed(() => animeItems.value.length + mangaItems.value.length)
const isPending = computed(() => animeLibrary.isPending.value || mangaLibrary.isPending.value)
const isBusy = computed(() => animeBulk.isPending.value || mangaBulk.isPending.value)

const moveTargets = computed(() => tagStore.tags.filter((candidate) => candidate.id !== tagId.value))

const selectedAnimeIds = computed(() =>
  animeItems.value.map((item) => item.id).filter((id) => selectedIds.value.has(id)),
)
const selectedMangaIds = computed(() =>
  mangaItems.value.map((item) => item.id).filter((id) => selectedIds.value.has(id)),
)
const selectedCount = computed(() => selectedAnimeIds.value.length + selectedMangaIds.value.length)

onMounted(() => {
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})

function toggleSelection(id: string): void {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function selectAll(): void {
  selectedIds.value = new Set([
    ...animeItems.value.map((item) => item.id),
    ...mangaItems.value.map((item) => item.id),
  ])
}

function clearSelection(): void {
  selectedIds.value = new Set()
}

// Anime and manga live behind separate endpoints, so a mixed selection fans out
// into one call per kind.
async function applyToSelection(patch: {
  add?: string[]
  remove?: string[]
  clear?: boolean
}): Promise<number> {
  const calls: Promise<number>[] = []
  if (selectedAnimeIds.value.length) {
    calls.push(animeBulk.mutateAsync({ ids: selectedAnimeIds.value, ...patch }))
  }
  if (selectedMangaIds.value.length) {
    calls.push(mangaBulk.mutateAsync({ ids: selectedMangaIds.value, ...patch }))
  }

  const updated = await Promise.all(calls)
  return updated.reduce((sum, count) => sum + count, 0)
}

async function removeTagFromSelection(): Promise<void> {
  const updated = await applyToSelection({ remove: [tagId.value] })
  toast.success(translate('bulk.applied', { count: updated }))
  clearSelection()
}

async function moveSelection(): Promise<void> {
  if (!moveTargetId.value) return

  const updated = await applyToSelection({
    add: [moveTargetId.value],
    remove: [tagId.value],
  })
  toast.success(translate('bulk.applied', { count: updated }))
  moveTargetId.value = null
  clearSelection()
}

async function removeSelectionFromCollection(): Promise<void> {
  const updated = await applyToSelection({ clear: true })
  toast.success(translate('bulk.applied', { count: updated }))
  clearSelection()
}

async function submitEdit(payload: ICreateTagDto): Promise<void> {
  await tagStore.updateTag(tagId.value, payload)
}

async function confirmDelete(mode: TagDeleteMode): Promise<void> {
  const animeIds = animeItems.value.map((item) => item.id)
  const mangaIds = mangaItems.value.map((item) => item.id)
  const patch = mode === 'removeFromCollection' ? { clear: true } : { remove: [tagId.value] }

  if (animeIds.length) await animeBulk.mutateAsync({ ids: animeIds, ...patch })
  if (mangaIds.length) await mangaBulk.mutateAsync({ ids: mangaIds, ...patch })

  await tagStore.deleteTag(tagId.value)
  await router.push({ name: 'tags' })
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <p
      v-if="!tag && !tagStore.isLoading"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ translate('errors.notFound') }}
    </p>

    <template v-else-if="tag">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <TagBadge :tag="tag" />
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ translatePlural('tags.itemCount', itemCount) }}
            <span v-if="tag.isSystem"> · {{ translate('tags.systemTag') }}</span>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <RouterLink
            :to="{ name: 'home', query: { tag: tag.id } }"
            class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-brand-400 dark:border-gray-700"
          >
            <i class="pi pi-filter mr-1" />
            {{ translate('tags.filterBy') }}
          </RouterLink>
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-brand-400 dark:border-gray-700"
            @click="isEditOpen = true"
          >
            <i class="pi pi-pencil mr-1" />
            {{ translate('tags.edit') }}
          </button>
          <button
            v-if="!tag.isSystem"
            type="button"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:border-red-400 dark:border-red-900 dark:text-red-300"
            @click="isDeleteOpen = true"
          >
            <i class="pi pi-trash mr-1" />
            {{ translate('tags.delete') }}
          </button>
        </div>
      </header>

      <LoadingSpinner
        v-if="isPending"
        size="sm"
      />

      <EmptyState
        v-else-if="itemCount === 0"
        :show-reset="false"
      />

      <template v-else>
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-3 py-1.5 transition-colors hover:border-brand-400 dark:border-gray-700"
            @click="selectAll"
          >
            {{ translate('common.selectAll') }}
          </button>
          <button
            v-if="selectedCount > 0"
            type="button"
            class="rounded-lg border border-gray-200 px-3 py-1.5 transition-colors hover:border-brand-400 dark:border-gray-700"
            @click="clearSelection"
          >
            {{ translate('common.clearSelection') }}
          </button>
          <span
            v-if="selectedCount > 0"
            class="text-gray-500 dark:text-gray-400"
          >
            {{ translate('common.selected', { count: selectedCount }) }}
          </span>
        </div>

        <div
          v-if="selectedCount > 0"
          class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
        >
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            :disabled="isBusy"
            @click="removeTagFromSelection"
          >
            {{ translate('bulk.removeThisTag') }}
          </button>

          <span class="flex items-center gap-2">
            <Select
              v-model="moveTargetId"
              :options="moveTargets"
              option-label="name"
              option-value="id"
              filter
              class="min-w-48"
              :placeholder="translate('bulk.moveTarget')"
              :aria-label="translate('bulk.moveTarget')"
            >
              <template #option="{ option }">
                <TagBadge
                  :tag="option"
                  size="sm"
                />
              </template>
            </Select>
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-3 py-1.5 transition-colors hover:border-brand-400 disabled:opacity-50 dark:border-gray-700"
              :disabled="isBusy || !moveTargetId"
              @click="moveSelection"
            >
              {{ translate('bulk.move') }}
            </button>
          </span>

          <button
            type="button"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-red-600 transition-colors hover:border-red-400 disabled:opacity-50 dark:border-red-900 dark:text-red-300"
            :disabled="isBusy"
            @click="removeSelectionFromCollection"
          >
            {{ translate('bulk.removeFromCollection') }}
          </button>
        </div>

        <AnimeList
          v-if="animeItems.length"
          :items="animeItems"
          :selected-ids="selectedIds"
          selectable
          @toggle-select="toggleSelection"
        />

        <section
          v-if="mangaItems.length"
          class="flex flex-col gap-2"
        >
          <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {{ translate('nav.manga') }}
          </h2>
          <MangaList :items="mangaItems" />
        </section>
      </template>

      <TagFormDialog
        v-model:visible="isEditOpen"
        :tag="tag"
        :next-sort-order="tag.sortOrder"
        @submit="submitEdit"
      />

      <TagDeleteDialog
        v-model:visible="isDeleteOpen"
        :tag="tag"
        :item-count="itemCount"
        @confirm="confirmDelete"
      />
    </template>
  </section>
</template>
