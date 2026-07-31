<script setup lang="ts">
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useSyncStore } from '@/stores/useSyncStore'

const { translate, translatePlural, locale } = useAppI18n()
const syncStore = useSyncStore()
const appVersion = __APP_VERSION__

const syncLabel = computed(() => {
  if (!syncStore.lastSyncAt) return translate('footer.neverSynced')
  const time = new Date(syncStore.lastSyncAt).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return translate('footer.synced', { time })
})
</script>

<template>
  <footer
    class="border-t border-gray-200 px-4 pb-20 pt-3 text-xs text-gray-500 md:pb-3 dark:border-gray-800 dark:text-gray-400"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span>{{ translate('footer.version', { version: appVersion }) }}</span>
      <span>{{ translate('footer.rights') }}</span>
      <span class="ml-auto flex items-center gap-2">
        <span
          class="size-2 rounded-full"
          :class="syncStore.hasConflicts ? 'bg-amber-500' : 'bg-emerald-500'"
        />
        <span>{{ syncLabel }}</span>
        <span
          v-if="syncStore.hasConflicts"
          class="text-amber-600 dark:text-amber-400"
        >
          {{ translatePlural('footer.pendingConflicts', syncStore.unresolvedCount) }}
        </span>
      </span>
    </div>
  </footer>
</template>
