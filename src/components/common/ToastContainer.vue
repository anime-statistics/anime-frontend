<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const SEVERITY_CLASSES = {
  info: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
  success: 'bg-emerald-600 text-white',
  warn: 'bg-amber-600 text-white',
  error: 'bg-red-600 text-white',
} as const
</script>

<template>
  <div
    class="pointer-events-none fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-6"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup name="page-fade">
      <button
        v-for="toast in toasts"
        :key="toast.id"
        type="button"
        class="pointer-events-auto rounded-lg px-4 py-2 text-sm shadow-lg"
        :class="SEVERITY_CLASSES[toast.severity]"
        @click="dismiss(toast.id)"
      >
        {{ toast.message }}
      </button>
    </TransitionGroup>
  </div>
</template>
