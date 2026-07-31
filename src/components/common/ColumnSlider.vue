<script setup lang="ts">
import Slider from 'primevue/slider'
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'

const props = withDefaults(
  defineProps<{ modelValue: number, min?: number, max?: number }>(),
  { min: 1, max: 12 },
)
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const { translate } = useAppI18n()

const columns = computed({
  get: () => props.modelValue,
  set: (value: number | number[]) => {
    emit('update:modelValue', Array.isArray(value) ? value[0] : value)
  },
})
</script>

<template>
  <label class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
    <Slider
      v-model="columns"
      class="w-32"
      :min="props.min"
      :max="props.max"
      :step="1"
      :aria-label="translate('settings.columns')"
    />
    <span class="tabular-nums">{{ props.modelValue }} {{ translate('common.columns') }}</span>
  </label>
</template>
