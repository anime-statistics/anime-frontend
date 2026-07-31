<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'

withDefaults(defineProps<{ icon?: string, showReset?: boolean }>(), {
  icon: 'pi-inbox',
  showReset: true,
})

const emit = defineEmits<{ reset: [] }>()

const { translate } = useAppI18n()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
    <i :class="['pi', icon, 'text-4xl text-gray-300 dark:text-gray-600']" />
    <p class="font-medium text-gray-700 dark:text-gray-200">
      {{ translate('empty.title') }}
    </p>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      {{ translate('empty.hint') }}
    </p>
    <button
      v-if="showReset"
      type="button"
      class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-brand-400 dark:border-gray-700 dark:text-gray-200"
      @click="emit('reset')"
    >
      {{ translate('empty.reset') }}
    </button>
  </div>
</template>
