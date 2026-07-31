<script setup lang="ts">
import { computed, ref } from 'vue'
import { VAceEditor } from 'vue3-ace-editor'
import { apiClient } from '@/apis/http/client'
import VoiceInput from '@/components/voice/VoiceInput.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useToast } from '@/composables/useToast'
import { NOTES } from '@/core/constants/apiRoutes'
import { isObject } from '@/core/utils/caseConverter'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import 'ace-builds/src-noconflict/ace'
import 'ace-builds/src-noconflict/mode-markdown'
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/ext-language_tools'

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const { translate } = useAppI18n()
const toast = useToast()
const settingsStore = useSettingsStore()
const voiceStore = useVoiceStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isDraggingOver = ref(false)
const isUploading = ref(false)

const theme = computed(() => (settingsStore.prefersDark ? 'monokai' : 'github'))

const TOOLBAR = [
  { icon: 'pi-bold', labelKey: 'editor.bold', before: '**', after: '**' },
  { icon: 'pi-italic', labelKey: 'editor.italic', before: '_', after: '_' },
  { icon: 'pi-hashtag', labelKey: 'editor.heading', before: '## ', after: '' },
  { icon: 'pi-list', labelKey: 'editor.list', before: '- ', after: '' },
  { icon: 'pi-link', labelKey: 'editor.link', before: '[', after: '](https://)' },
  { icon: 'pi-code', labelKey: 'editor.code', before: '```\n', after: '\n```' },
] as const

function append(snippet: string): void {
  const separator = props.modelValue.endsWith('\n') || !props.modelValue ? '' : '\n'
  emit('update:modelValue', `${props.modelValue}${separator}${snippet}`)
}

function insert(before: string, after: string): void {
  append(`${before}${after}`)
}

async function upload(file: File): Promise<void> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    toast.error(translate('editor.attachWrongType'))
    return
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    toast.error(translate('editor.attachTooLarge'))
    return
  }

  const form = new FormData()
  form.append('file', file)

  isUploading.value = true
  try {
    const { data } = await apiClient.post<unknown>(`${NOTES}/attachments`, form)
    if (!isObject(data) || typeof data.url !== 'string') throw new Error('Unexpected response')

    append(`![${file.name}](${data.url})`)
    toast.success(translate('editor.attachDone'))
  } catch {
    toast.error(translate('editor.attachFailed'))
  } finally {
    isUploading.value = false
  }
}

function onFileSelected(event: Event): void {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return

  const file = input.files?.[0]
  if (file) void upload(file)
  input.value = ''
}

// Dictation is cleaned up by the AI endpoint before it lands in the note.
async function onVoiceTranscript(text: string): Promise<void> {
  const { processedText } = await voiceStore.processTranscript(text)
  if (processedText) append(processedText)
}

function onDrop(event: DragEvent): void {
  isDraggingOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) void upload(file)
}
</script>

<template>
  <div class="flex h-full min-h-[300px] flex-col md:min-h-[400px]">
    <div class="flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2 dark:border-gray-700">
      <button
        v-for="item in TOOLBAR"
        :key="item.labelKey"
        type="button"
        class="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        :title="translate(item.labelKey)"
        :aria-label="translate(item.labelKey)"
        @click="insert(item.before, item.after)"
      >
        <i :class="['pi', item.icon, 'text-sm']" />
      </button>

      <button
        type="button"
        class="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
        :title="translate('editor.attach')"
        :aria-label="translate('editor.attach')"
        :disabled="isUploading"
        @click="fileInput?.click()"
      >
        <i class="pi pi-paperclip text-sm" />
      </button>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="image/png,image/jpeg,image/gif,image/webp"
        @change="onFileSelected"
      >

      <VoiceInput
        class="ml-auto"
        continuous
        show-language
        @transcript="onVoiceTranscript"
      />
    </div>

    <div
      class="relative flex-1"
      @dragover.prevent="isDraggingOver = true"
      @dragleave="isDraggingOver = false"
      @drop.prevent="onDrop"
    >
      <VAceEditor
        :value="props.modelValue"
        lang="markdown"
        :theme="theme"
        class="size-full min-h-[300px] md:min-h-[400px]"
        :options="{
          fontSize: 14,
          showPrintMargin: false,
          wrap: true,
          useWorker: false,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
        }"
        @update:value="emit('update:modelValue', $event)"
      />

      <div
        v-if="isDraggingOver"
        class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-brand-500 bg-brand-50/80 text-sm text-brand-700 dark:bg-gray-900/80 dark:text-brand-300"
      >
        {{ translate('editor.dropHere') }}
      </div>
    </div>
  </div>
</template>
