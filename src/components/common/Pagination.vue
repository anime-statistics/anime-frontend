<script setup lang="ts">
import Paginator, { type PageState } from 'primevue/paginator'
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'

const props = withDefaults(
  defineProps<{ page: number, size: number, total: number, sizeOptions?: number[] }>(),
  { sizeOptions: () => [10, 20, 50] },
)
const emit = defineEmits<{ change: [{ page: number, size: number }] }>()

const { translatePlural } = useAppI18n()

const first = computed(() => (props.page - 1) * props.size)

function onPage(event: PageState): void {
  emit('change', { page: event.page + 1, size: event.rows })
}
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <Paginator
      :first="first"
      :rows="props.size"
      :total-records="props.total"
      :rows-per-page-options="props.sizeOptions"
      @page="onPage"
    />
    <p class="text-xs text-gray-500 dark:text-gray-400">
      {{ translatePlural('pagination.results', props.total) }}
    </p>
  </div>
</template>
