<script setup lang="ts">
import { ref } from 'vue'
import { ANIME_STATUSES, type AnimeStatus } from '@/apis/dtos/animeDto'
import { useAppI18n } from '@/composables/useAppI18n'

const props = defineProps<{ selectedCount: number, isBusy?: boolean }>()
const emit = defineEmits<{
  changeStatus: [AnimeStatus]
  clear: []
}>()

const { translate } = useAppI18n()
const isStatusOpen = ref(false)

function applyStatus(status: AnimeStatus): void {
  isStatusOpen.value = false
  emit('changeStatus', status)
}
</script>

<template>
  <div
    v-if="props.selectedCount > 0"
    class="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-lg bg-brand-600 p-3 text-sm text-white shadow-xl"
  >
    <span class="font-medium">
      {{ translate('common.selected', { count: props.selectedCount }) }}
    </span>

    <div class="relative">
      <button
        type="button"
        class="rounded-lg bg-white/15 px-3 py-1.5 transition-colors hover:bg-white/25 disabled:opacity-50"
        :disabled="props.isBusy"
        @click="isStatusOpen = !isStatusOpen"
      >
        {{ translate('bulk.changeStatus') }}
      </button>

      <ul
        v-if="isStatusOpen"
        class="absolute bottom-full left-0 mb-1 w-44 overflow-hidden rounded-lg bg-white text-gray-800 shadow-xl dark:bg-gray-800 dark:text-gray-100"
      >
        <li
          v-for="status in ANIME_STATUSES"
          :key="status"
        >
          <button
            type="button"
            class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="applyStatus(status)"
          >
            {{ translate(`anime.status.${status}`) }}
          </button>
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="ml-auto underline underline-offset-2"
      @click="emit('clear')"
    >
      {{ translate('common.clearSelection') }}
    </button>
  </div>
</template>
