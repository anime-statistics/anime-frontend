<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { ICreateTagDto, ITagDto } from '@/apis/dtos/tagDto'
import TagBadge from '@/components/common/TagBadge.vue'
import TagFormDialog from '@/components/common/TagFormDialog.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useTagStore } from '@/stores/useTagStore'

const { translate, translatePlural } = useAppI18n()
const tagStore = useTagStore()

const orderedTags = ref<ITagDto[]>([])
const isDialogOpen = ref(false)
const editingTag = ref<ITagDto | null>(null)

const nextSortOrder = computed(() => tagStore.tags.length)

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

async function submitTag(payload: ICreateTagDto): Promise<void> {
  if (editingTag.value) await tagStore.updateTag(editingTag.value.id, payload)
  else await tagStore.createTag(payload)
}

async function removeTag(tag: ITagDto): Promise<void> {
  if (!window.confirm(translate('tags.confirmDelete', { name: tag.name }))) return
  await tagStore.deleteTag(tag.id)
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

        <TagBadge
          :tag="tag"
          :dimmed="tag.isHidden"
        />

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
            @click="removeTag(tag)"
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
  </section>
</template>
