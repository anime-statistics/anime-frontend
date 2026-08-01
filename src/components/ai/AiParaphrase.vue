<script setup lang="ts">
import { diffWords } from 'diff'
import { computed, ref } from 'vue'
import { paraphrase, type IAiRequestOptions } from '@/apis/aiApi'
import { useAiUsage } from '@/composables/useAiUsage'
import { useAppI18n } from '@/composables/useAppI18n'
import type { ILLmModel } from '@/types/ai'

const props = defineProps<{ options: IAiRequestOptions, model?: ILLmModel }>()

const { translate } = useAppI18n()
const usage = useAiUsage()

const STYLES = [
  { value: 'formal', labelKey: 'ai.styleFormal' },
  { value: 'casual', labelKey: 'ai.styleCasual' },
  { value: 'compress', labelKey: 'ai.styleCompress' },
  { value: 'academic', labelKey: 'ai.styleAcademic' },
] as const

const sourceText = ref('')
const style = ref<string>('formal')
const result = ref('')
const paraphrasedSource = ref('')
const isBusy = ref(false)
const hasError = ref(false)
const textarea = ref<HTMLTextAreaElement | null>(null)
const selection = ref<{ start: number, end: number } | null>(null)

const hasSelection = computed(
  () => selection.value !== null && selection.value.end > selection.value.start,
)

const diffParts = computed(() => {
  if (!result.value || !paraphrasedSource.value) return []
  return diffWords(paraphrasedSource.value, result.value)
})

function captureSelection(): void {
  const element = textarea.value
  if (!element) return
  selection.value = { start: element.selectionStart, end: element.selectionEnd }
}

async function run(): Promise<void> {
  const fragment = hasSelection.value && selection.value
    ? sourceText.value.slice(selection.value.start, selection.value.end)
    : sourceText.value

  if (!fragment.trim() || isBusy.value) return

  isBusy.value = true
  hasError.value = false

  try {
    const response = await paraphrase(fragment, style.value, props.options)
    usage.record(props.model, props.options.model, response.usage.inputTokens, response.usage.outputTokens)

    if (hasSelection.value && selection.value) {
      const { start, end } = selection.value
      paraphrasedSource.value = sourceText.value
      result.value
        = sourceText.value.slice(0, start) + response.result + sourceText.value.slice(end)
    } else {
      paraphrasedSource.value = fragment
      result.value = response.result
    }
  } catch {
    hasError.value = true
  } finally {
    isBusy.value = false
  }
}

function applyResult(): void {
  if (!result.value) return
  sourceText.value = result.value
  result.value = ''
  paraphrasedSource.value = ''
  selection.value = null
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-gray-600 dark:text-gray-300">{{ translate('ai.sourceText') }}</span>
      <textarea
        ref="textarea"
        v-model="sourceText"
        rows="5"
        class="w-full rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-700"
        @select="captureSelection"
        @keyup="captureSelection"
        @mouseup="captureSelection"
      />
    </label>

    <p
      v-if="hasSelection"
      class="text-xs text-brand-600 dark:text-brand-300"
    >
      {{ translate('ai.paraphraseSelectionHint') }}
    </p>

    <div class="flex items-center gap-2">
      <label class="flex flex-1 flex-col gap-1 text-sm">
        <span class="text-gray-600 dark:text-gray-300">{{ translate('ai.style') }}</span>
        <select
          v-model="style"
          class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option
            v-for="option in STYLES"
            :key="option.value"
            :value="option.value"
          >
            {{ translate(option.labelKey) }}
          </option>
        </select>
      </label>

      <button
        type="button"
        class="self-end rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        :disabled="isBusy || !sourceText.trim()"
        @click="run"
      >
        {{ isBusy ? translate('ai.thinking') : translate('ai.paraphraseAction') }}
      </button>
    </div>

    <div
      v-if="hasError"
      class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
    >
      <span>{{ translate('ai.unavailable') }}</span>
      <button
        type="button"
        class="underline underline-offset-2"
        @click="run"
      >
        {{ translate('ai.retry') }}
      </button>
    </div>

    <div
      v-if="diffParts.length"
      class="flex flex-col gap-2"
    >
      <p class="rounded-lg border border-gray-200 p-2 text-sm leading-relaxed dark:border-gray-700">
        <template
          v-for="(part, index) in diffParts"
          :key="index"
        >
          <del
            v-if="part.removed"
            class="bg-red-100 text-red-700 no-underline line-through dark:bg-red-900/40 dark:text-red-300"
          >{{ part.value }}</del>
          <ins
            v-else-if="part.added"
            class="bg-emerald-100 text-emerald-700 no-underline dark:bg-emerald-900/40 dark:text-emerald-300"
          >{{ part.value }}</ins>
          <span v-else>{{ part.value }}</span>
        </template>
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ translate('ai.diffLegend') }}
      </p>
      <button
        type="button"
        class="self-start rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-brand-400 dark:border-gray-700"
        @click="applyResult"
      >
        {{ translate('ai.applyResult') }}
      </button>
    </div>
  </section>
</template>
