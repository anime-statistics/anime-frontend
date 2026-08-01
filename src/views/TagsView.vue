<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import type { ICreateTagDto, ITagDto } from '@/apis/dtos/tagDto'
import TagBadge from '@/components/common/TagBadge.vue'
import TagDeleteDialog, { type TagDeleteMode } from '@/components/common/TagDeleteDialog.vue'
import TagFormDialog from '@/components/common/TagFormDialog.vue'
import { useAnimeBulkTagMutation, useAnimeLibrary } from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import { useMangaBulkTagMutation, useMangaLibrary } from '@/composables/useMangaQueries'
import { useTagStore } from '@/stores/useTagStore'

const { translate, translatePlural } = useAppI18n()
const router = useRouter()
const tagStore = useTagStore()

const animeLibrary = useAnimeLibrary()
const mangaLibrary = useMangaLibrary()
const animeBulk = useAnimeBulkTagMutation()
const mangaBulk = useMangaBulkTagMutation()

const orderedTags = ref<ITagDto[]>([])
const isDialogOpen = ref(false)
const editingTag = ref<ITagDto | null>(null)
const deletingTag = ref<ITagDto | null>(null)
const isDeleteOpen = ref(false)

const nextSortOrder = computed(() => tagStore.tags.length)

// One pass over the collection gives every tag its count.
const countsByTag = computed(() => {
  const counts = new Map<string, string[]>()
  const record = (id: string, mediaId: string): void => {
    counts.set(id, [...(counts.get(id) ?? []), mediaId])
  }

  for (const item of animeLibrary.data.value?.items ?? []) {
    for (const id of item.myTags) record(id, item.id)
  }
  for (const item of mangaLibrary.data.value?.items ?? []) {
    for (const id of item.myTags) record(id, item.id)
  }
  return counts
})

function countOf(tagId: string): number {
  return countsByTag.value.get(tagId)?.length ?? 0
}

onMounted(() => {
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})

watch(
  () => tagStore.tags,
  (tags) => {
    orderedTags.value = [...tags].toSorted((a, b) => a.sortOrder - b.sortOrder)
  },
  { immediate: true },
)

function openCreate(): void {
  editingTag.value = null
  isDialogOpen.value = true
}

function openEdit(tag: ITagDto): void {
  editingTag.value = tag
  isDialogOpen.value = true
}

function openDelete(tag: ITagDto): void {
  deletingTag.value = tag
  isDeleteOpen.value = true
}

async function submitTag(payload: ICreateTagDto): Promise<void> {
  if (editingTag.value) await tagStore.updateTag(editingTag.value.id, payload)
  else await tagStore.createTag(payload)
}

async function confirmDelete(mode: TagDeleteMode): Promise<void> {
  const tag = deletingTag.value
  if (!tag) return

  const patch = mode === 'removeFromCollection' ? { clear: true } : { remove: [tag.id] }
  const animeIds = (animeLibrary.data.value?.items ?? [])
    .filter((item) => item.myTags.includes(tag.id))
    .map((item) => item.id)
  const mangaIds = (mangaLibrary.data.value?.items ?? [])
    .filter((item) => item.myTags.includes(tag.id))
    .map((item) => item.id)

  if (animeIds.length) await animeBulk.mutateAsync({ ids: animeIds, ...patch })
  if (mangaIds.length) await mangaBulk.mutateAsync({ ids: mangaIds, ...patch })

  await tagStore.deleteTag(tag.id)
  deletingTag.value = null
}

function openTag(tag: ITagDto): void {
  void router.push({ name: 'tag-detail', params: { id: tag.id } })
}

async function persistOrder(): Promise<void> {
  await tagStore.reorderTags(orderedTags.value.map((tag) => tag.id))
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ translate('pages.tagsTitle') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ translatePlural('tags.count', tagStore.tags.length) }} · {{ translate('tags.reorderHint') }}
        </p>
      </div>

      <button
        type="button"
        class="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        @click="openCreate"
      >
        <i class="pi pi-plus mr-1" />
        {{ translate('tags.create') }}
      </button>
    </header>

    <p
      v-if="tagStore.errorMessage"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ tagStore.errorMessage }}
    </p>

    <p
      v-else-if="tagStore.tags.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('tags.empty') }}
    </p>

    <VueDraggable
      v-else
      v-model="orderedTags"
      :animation="150"
      handle=".tag-drag-handle"
      class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
      @end="persistOrder"
    >
      <article
        v-for="tag in orderedTags"
        :key="tag.id"
        class="flex items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
      >
        <button
          type="button"
          class="tag-drag-handle cursor-grab text-gray-400 active:cursor-grabbing"
          :aria-label="translate('tags.reorderHint')"
        >
          <i class="pi pi-bars" />
        </button>

        <!-- The tag itself opens its page: that is where its titles and the bulk
             actions live. -->
        <button
          type="button"
          class="flex min-w-0 items-center gap-2 text-left"
          :title="translate('tags.openPage')"
          @click="openTag(tag)"
        >
          <TagBadge
            :tag="tag"
            :dimmed="tag.isHidden"
          />
          <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {{ countOf(tag.id) }}
          </span>
        </button>

        <div class="ml-auto flex items-center gap-1">
          <button
            type="button"
            class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            :aria-label="tag.isHidden ? translate('layout.showTag') : translate('layout.hideTag')"
            @click="tagStore.toggleTagVisibility(tag.id)"
          >
            <i :class="['pi', tag.isHidden ? 'pi-eye-slash' : 'pi-eye']" />
          </button>
          <button
            type="button"
            class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            :aria-label="translate('tags.edit')"
            @click="openEdit(tag)"
          >
            <i class="pi pi-pencil" />
          </button>
          <button
            type="button"
            class="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-gray-800"
            :aria-label="translate('tags.delete')"
            @click="openDelete(tag)"
          >
            <i class="pi pi-trash" />
          </button>
        </div>
      </article>
    </VueDraggable>

    <TagFormDialog
      v-model:visible="isDialogOpen"
      :tag="editingTag"
      :next-sort-order="nextSortOrder"
      @submit="submitTag"
    />

    <TagDeleteDialog
      v-model:visible="isDeleteOpen"
      :tag="deletingTag"
      :item-count="deletingTag ? countOf(deletingTag.id) : 0"
      @confirm="confirmDelete"
    />
  </section>
</template>
