<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'
import type { AppMessageKey } from '@/core/i18n/types'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { translate } = useAppI18n()

const SHORTCUTS: { keys: string, labelKey: AppMessageKey }[] = [
  { keys: 'Ctrl + K', labelKey: 'shortcuts.search' },
  { keys: 'Ctrl + Shift + T', labelKey: 'shortcuts.tags' },
  { keys: 'Ctrl + Shift + N', labelKey: 'shortcuts.newNote' },
  { keys: 'Ctrl + A', labelKey: 'shortcuts.selectAll' },
  { keys: '?', labelKey: 'shortcuts.help' },
  { keys: 'Esc', labelKey: 'shortcuts.close' },
]
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="translate('shortcuts.title')"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl dark:bg-gray-900">
      <header class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ translate('shortcuts.title') }}
        </h2>
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          :aria-label="translate('shortcuts.close')"
          @click="emit('close')"
        >
          <i class="pi pi-times" />
        </button>
      </header>

      <dl class="flex flex-col gap-2 text-sm">
        <div
          v-for="shortcut in SHORTCUTS"
          :key="shortcut.keys"
          class="flex items-center justify-between gap-4"
        >
          <dt class="text-gray-600 dark:text-gray-300">
            {{ translate(shortcut.labelKey) }}
          </dt>
          <dd>
            <kbd class="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 font-mono text-xs dark:border-gray-600 dark:bg-gray-800">
              {{ shortcut.keys }}
            </kbd>
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
