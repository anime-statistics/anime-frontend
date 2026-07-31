<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'

withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })

const { translate } = useAppI18n()

const SIZE_CLASSES = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-10 border-4',
} as const
</script>

<template>
  <span
    class="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400"
    role="status"
    :aria-label="translate('app.loading')"
  >
    <span
      class="animate-spin rounded-full border-current border-t-transparent motion-reduce:animate-none"
      :class="SIZE_CLASSES[size]"
    />
  </span>
</template>
