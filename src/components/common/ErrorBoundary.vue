<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'

const { translate } = useAppI18n()

const error = ref<Error | null>(null)

onErrorCaptured((caught) => {
  error.value = caught instanceof Error ? caught : new Error(String(caught))
  return false
})

function resetError(): void {
  error.value = null
}
</script>

<template>
  <div
    v-if="error"
    class="rounded-lg bg-red-50 p-6 text-center dark:bg-red-900/20"
    role="alert"
  >
    <i class="pi pi-exclamation-triangle mb-4 text-4xl text-red-500" />
    <h3 class="text-lg font-bold text-red-800 dark:text-red-200">
      {{ translate('errors.unexpected') }}
    </h3>
    <p class="mt-2 text-sm text-red-600 dark:text-red-300">
      {{ error.message }}
    </p>
    <button
      type="button"
      class="mt-4 min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
      @click="resetError"
    >
      {{ translate('errors.retry') }}
    </button>
  </div>

  <slot v-else />
</template>
