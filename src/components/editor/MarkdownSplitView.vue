<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import MarkdownPreview from '@/components/editor/MarkdownPreview.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useIsMobile } from '@/composables/useMediaQuery'

const MIN_PERCENT = 20
const MAX_PERCENT = 80

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const { translate } = useAppI18n()
const isMobile = useIsMobile()

const container = ref<HTMLElement | null>(null)
const editorPercent = ref(50)
const isResizing = ref(false)
const mobileTab = ref<'editor' | 'preview'>('editor')

const gridTemplate = computed(() => ({
  gridTemplateColumns: `${editorPercent.value}% 0.5rem 1fr`,
}))

function onPointerMove(event: PointerEvent): void {
  if (!container.value) return

  const bounds = container.value.getBoundingClientRect()
  const percent = ((event.clientX - bounds.left) / bounds.width) * 100
  editorPercent.value = Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent))
}

function stopResizing(): void {
  isResizing.value = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', stopResizing)
}

function startResizing(): void {
  isResizing.value = true
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', stopResizing)
}

function nudge(deltaPercent: number): void {
  editorPercent.value = Math.min(
    MAX_PERCENT,
    Math.max(MIN_PERCENT, editorPercent.value + deltaPercent),
  )
}

onUnmounted(stopResizing)
</script>

<template>
  <div
    v-if="isMobile"
    class="flex flex-col gap-2"
  >
    <div
      class="flex gap-1 border-b border-gray-200 dark:border-gray-800"
      role="tablist"
    >
      <button
        type="button"
        role="tab"
        class="-mb-px border-b-2 px-3 py-2 text-sm"
        :class="mobileTab === 'editor'
          ? 'border-brand-600 text-brand-600 dark:text-brand-300'
          : 'border-transparent text-gray-500 dark:text-gray-400'"
        :aria-selected="mobileTab === 'editor'"
        @click="mobileTab = 'editor'"
      >
        {{ translate('editor.editorTab') }}
      </button>
      <button
        type="button"
        role="tab"
        class="-mb-px border-b-2 px-3 py-2 text-sm"
        :class="mobileTab === 'preview'
          ? 'border-brand-600 text-brand-600 dark:text-brand-300'
          : 'border-transparent text-gray-500 dark:text-gray-400'"
        :aria-selected="mobileTab === 'preview'"
        @click="mobileTab = 'preview'"
      >
        {{ translate('editor.previewTab') }}
      </button>
    </div>

    <MarkdownEditor
      v-if="mobileTab === 'editor'"
      :model-value="props.modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <MarkdownPreview
      v-else
      :content="props.modelValue"
      class="min-h-[300px]"
    />
  </div>

  <div
    v-else
    ref="container"
    class="grid h-full min-h-[400px]"
    :style="gridTemplate"
  >
    <MarkdownEditor
      :model-value="props.modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <div
      class="group flex cursor-col-resize items-center justify-center"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      :aria-valuenow="Math.round(editorPercent)"
      aria-valuemin="20"
      aria-valuemax="80"
      :aria-label="translate('editor.resize')"
      @pointerdown.prevent="startResizing"
      @keydown.left.prevent="nudge(-5)"
      @keydown.right.prevent="nudge(5)"
    >
      <span
        class="h-full w-0.5 rounded bg-gray-200 transition-colors group-hover:bg-brand-500 dark:bg-gray-700"
        :class="isResizing ? 'bg-brand-500' : ''"
      />
    </div>

    <MarkdownPreview
      :content="props.modelValue"
      class="pl-2"
    />
  </div>
</template>
