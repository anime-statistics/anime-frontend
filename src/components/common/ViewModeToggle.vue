<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'
import type { IViewMode } from '@/types/settings'

const props = defineProps<{ modelValue: IViewMode }>()
const emit = defineEmits<{ 'update:modelValue': [IViewMode] }>()

const { translate } = useAppI18n()

const VIEW_MODES = [
  { value: 'cards', icon: 'pi-th-large', labelKey: 'viewMode.cards' },
  { value: 'list', icon: 'pi-list', labelKey: 'viewMode.list' },
  { value: 'table', icon: 'pi-table', labelKey: 'viewMode.table' },
  { value: 'kanban', icon: 'pi-server', labelKey: 'viewMode.kanban' },
] as const
</script>

<template>
  <div
    class="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700"
    role="group"
    :aria-label="translate('viewMode.label')"
  >
    <button
      v-for="mode in VIEW_MODES"
      :key="mode.value"
      type="button"
      class="rounded-md px-2.5 py-1.5 text-sm transition-colors"
      :class="props.modelValue === mode.value
        ? 'bg-brand-600 text-white'
        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
      :aria-pressed="props.modelValue === mode.value"
      :title="translate(mode.labelKey)"
      :aria-label="translate(mode.labelKey)"
      @click="emit('update:modelValue', mode.value)"
    >
      <i :class="['pi', mode.icon]" />
    </button>
  </div>
</template>
