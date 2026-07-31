<script setup lang="ts">
import { computed, ref } from 'vue'
import type { INoteDto } from '@/apis/dtos/noteDto'
import { useAppI18n } from '@/composables/useAppI18n'
import { useHaptic } from '@/composables/useHaptic'

const props = defineProps<{ notes: INoteDto[], selectedId: string | null }>()
const emit = defineEmits<{
  select: [string]
  create: []
  remove: [string]
  exportMarkdown: [string]
  exportPdf: [string]
}>()

const { translate, translatePlural, locale } = useAppI18n()
const haptic = useHaptic()

const search = ref('')
const openMenuId = ref<string | null>(null)

const sortedNotes = computed(() =>
  props.notes.toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
)

const filteredNotes = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return sortedNotes.value
  return sortedNotes.value.filter((note) => note.content.toLowerCase().includes(query))
})

function preview(note: INoteDto): string {
  const firstLine = note.content.split('\n').find((line) => line.trim().length > 0)
  return firstLine?.replace(/^#+\s*/, '').slice(0, 60) ?? translate('notes.untitled')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value, { dateStyle: 'medium' })
}

function runAction(action: 'remove' | 'exportMarkdown' | 'exportPdf', id: string): void {
  openMenuId.value = null
  if (action === 'remove') {
    haptic.error()
    emit('remove', id)
  } else if (action === 'exportMarkdown') emit('exportMarkdown', id)
  else emit('exportPdf', id)
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <input
        v-model="search"
        type="search"
        class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-gray-700"
        :placeholder="translate('notes.search')"
        :aria-label="translate('notes.search')"
      >
      <button
        type="button"
        class="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700"
        @click="emit('create')"
      >
        <i class="pi pi-plus mr-1 text-xs" />
        {{ translate('notes.add') }}
      </button>
    </div>

    <p class="text-xs text-gray-500 dark:text-gray-400">
      {{ translatePlural('notes.count', props.notes.length) }}
    </p>

    <p
      v-if="props.notes.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('notes.empty') }}
    </p>

    <p
      v-else-if="filteredNotes.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('notes.searchEmpty') }}
    </p>

    <ul
      v-else
      class="flex flex-col gap-1"
    >
      <li
        v-for="note in filteredNotes"
        :key="note.id"
        class="relative flex items-center gap-2 rounded-lg border p-2 transition-colors"
        :class="note.id === props.selectedId
          ? 'border-brand-500 bg-brand-50 dark:bg-gray-800'
          : 'border-gray-200 hover:border-brand-400 dark:border-gray-700'"
      >
        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          @click="emit('select', note.id)"
        >
          <span class="block truncate text-sm text-gray-800 dark:text-gray-100">
            {{ preview(note) }}
          </span>
          <span class="block text-xs text-gray-500 dark:text-gray-400">
            {{ translate('notes.updated', { date: formatDate(note.updatedAt) }) }}
          </span>
        </button>

        <button
          type="button"
          class="shrink-0 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          :aria-label="translate('actions.edit')"
          :aria-expanded="openMenuId === note.id"
          @click="openMenuId = openMenuId === note.id ? null : note.id"
        >
          <i class="pi pi-ellipsis-v text-sm" />
        </button>

        <ul
          v-if="openMenuId === note.id"
          class="absolute right-2 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <li>
            <button
              type="button"
              class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="runAction('exportMarkdown', note.id)"
            >
              {{ translate('notes.exportMarkdown') }}
            </button>
          </li>
          <li>
            <button
              type="button"
              class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="runAction('exportPdf', note.id)"
            >
              {{ translate('notes.exportPdf') }}
            </button>
          </li>
          <li>
            <button
              type="button"
              class="w-full px-3 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="runAction('remove', note.id)"
            >
              {{ translate('actions.delete') }}
            </button>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>
