<script setup lang="ts">
import { ref } from 'vue'
import type { INoteDto } from '@/apis/dtos/noteDto'
import { useAppI18n } from '@/composables/useAppI18n'

const props = withDefaults(
  defineProps<{ notes: INoteDto[], isBusy?: boolean }>(),
  { isBusy: false },
)
const emit = defineEmits<{ create: [string], update: [{ id: string, content: string }], remove: [string] }>()

const { translate, translatePlural, locale } = useAppI18n()

const draft = ref('')
const editingId = ref<string | null>(null)
const editingContent = ref('')

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value, { dateStyle: 'medium' })
}

function submitDraft(): void {
  const content = draft.value.trim()
  if (!content) return
  emit('create', content)
  draft.value = ''
}

function startEdit(note: INoteDto): void {
  editingId.value = note.id
  editingContent.value = note.content
}

function submitEdit(): void {
  if (!editingId.value) return
  emit('update', { id: editingId.value, content: editingContent.value })
  editingId.value = null
}

function remove(note: INoteDto): void {
  if (!window.confirm(translate('notes.confirmDelete'))) return
  emit('remove', note.id)
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <form
      class="flex flex-col gap-2"
      @submit.prevent="submitDraft"
    >
      <textarea
        v-model="draft"
        rows="3"
        class="w-full rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-700"
        :placeholder="translate('notes.placeholder')"
        :aria-label="translate('notes.add')"
      />
      <button
        type="submit"
        class="self-start rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        :disabled="props.isBusy || !draft.trim()"
      >
        {{ translate('notes.add') }}
      </button>
    </form>

    <p class="text-xs text-gray-500 dark:text-gray-400">
      {{ translatePlural('notes.count', props.notes.length) }}
    </p>

    <p
      v-if="props.notes.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('notes.empty') }}
    </p>

    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <li
        v-for="note in props.notes"
        :key="note.id"
        class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
      >
        <div
          v-if="editingId === note.id"
          class="flex flex-col gap-2"
        >
          <textarea
            v-model="editingContent"
            rows="6"
            class="w-full rounded-lg border border-gray-200 bg-transparent p-2 font-mono text-xs dark:border-gray-700"
            :aria-label="translate('actions.edit')"
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-3 py-1 text-sm text-white"
              @click="submitEdit"
            >
              {{ translate('actions.save') }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-3 py-1 text-sm dark:border-gray-700"
              @click="editingId = null"
            >
              {{ translate('actions.cancel') }}
            </button>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col gap-2"
        >
          <pre class="whitespace-pre-wrap break-words font-sans text-sm text-gray-800 dark:text-gray-200">{{ note.content }}</pre>
          <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{{ translate('notes.updated', { date: formatDate(note.updatedAt) }) }}</span>
            <button
              type="button"
              class="ml-auto underline underline-offset-2"
              @click="startEdit(note)"
            >
              {{ translate('actions.edit') }}
            </button>
            <button
              type="button"
              class="text-red-500 underline underline-offset-2"
              @click="remove(note)"
            >
              {{ translate('actions.delete') }}
            </button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
