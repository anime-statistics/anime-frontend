<script setup lang="ts">
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { computed, ref, toRef, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { INoteDto } from '@/apis/dtos/noteDto'
import MarkdownSplitView from '@/components/editor/MarkdownSplitView.vue'
import NotesList from '@/components/editor/NotesList.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { draftKey, useNoteDraft } from '@/composables/useNoteDraft'
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
} from '@/composables/useNoteQueries'
import { useToast } from '@/composables/useToast'
import { downloadMarkdown, noteFileName, printHtml } from '@/core/utils/exportNote'

const AUTOSAVE_DELAY = 2000

const props = defineProps<{ mediaId: string }>()

const { translate } = useAppI18n()
const toast = useToast()
const mediaId = toRef(props, 'mediaId')

const notesQuery = useNotes(mediaId)
const createNote = useCreateNote(mediaId)
const updateNote = useUpdateNote(mediaId)
const deleteNote = useDeleteNote(mediaId)

const notes = computed<INoteDto[]>(() => notesQuery.data.value ?? [])
const selectedId = ref<string | null>(null)
const content = ref('')
const savedContent = ref('')

const isDirty = computed(() => content.value !== savedContent.value)
const currentKey = computed(() => draftKey(props.mediaId, selectedId.value))
const draft = useNoteDraft(currentKey, isDirty)

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true })

function openNote(id: string): void {
  const note = notes.value.find((item) => item.id === id)
  if (!note) return

  selectedId.value = id
  savedContent.value = note.content

  const stored = localStorage.getItem(draftKey(props.mediaId, id))
  if (stored && stored !== note.content) {
    content.value = stored
    toast.show(translate('notes.draftRestored'))
  } else {
    content.value = note.content
  }
}

function startNewNote(): void {
  selectedId.value = null
  savedContent.value = ''
  content.value = draft.read() ?? ''
}

const persist = useDebounceFn(async () => {
  if (!isDirty.value || !content.value.trim()) return

  if (selectedId.value) {
    await updateNote.mutateAsync({ id: selectedId.value, content: content.value })
  } else {
    const created = await createNote.mutateAsync({
      mediaId: props.mediaId,
      content: content.value,
    })
    selectedId.value = created.id
  }

  savedContent.value = content.value
  draft.discard()
}, AUTOSAVE_DELAY)

watch(content, (value) => {
  if (isDirty.value) draft.write(value)
  void persist()
})

watch(mediaId, () => {
  selectedId.value = null
  content.value = ''
  savedContent.value = ''
})

async function removeNote(id: string): Promise<void> {
  if (!window.confirm(translate('notes.confirmDelete'))) return

  await deleteNote.mutateAsync(id)
  localStorage.removeItem(draftKey(props.mediaId, id))
  if (selectedId.value === id) startNewNote()
}

function exportMarkdown(id: string): void {
  const note = notes.value.find((item) => item.id === id)
  if (!note) return
  downloadMarkdown(note.content, noteFileName(note.content, translate('notes.untitled')))
}

function exportPdf(id: string): void {
  const note = notes.value.find((item) => item.id === id)
  if (!note) return

  printHtml(
    DOMPurify.sanitize(markdown.render(note.content)),
    noteFileName(note.content, translate('notes.untitled')),
  )
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <NotesList
      :notes="notes"
      :selected-id="selectedId"
      @select="openNote"
      @create="startNewNote"
      @remove="removeNote"
      @export-markdown="exportMarkdown"
      @export-pdf="exportPdf"
    />

    <div class="flex items-center gap-2 text-xs">
      <span
        class="inline-flex items-center gap-1"
        :class="isDirty ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'"
      >
        <i :class="['pi', isDirty ? 'pi-clock' : 'pi-check']" />
        {{ isDirty ? translate('notes.unsaved') : translate('notes.saved') }}
      </span>
    </div>

    <MarkdownSplitView v-model="content" />
  </div>
</template>
