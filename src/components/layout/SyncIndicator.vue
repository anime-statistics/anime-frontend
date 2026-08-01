<script setup lang="ts">
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useSyncStore } from '@/stores/useSyncStore'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { translate, translatePlural, locale } = useAppI18n()
const syncStore = useSyncStore()

const label = computed(() => {
  if (!syncStore.lastSyncAt) return translate('sync.never')
  const time = new Date(syncStore.lastSyncAt).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return translate('sync.at', { time })
})

// The dot is the whole indicator when the panel is collapsed, so its colour has
// to carry the state on its own.
const dotClass = computed(() => {
  if (syncStore.state === 'syncing') return 'bg-brand-500 animate-pulse'
  if (syncStore.hasConflicts) return 'bg-amber-500'
  if (syncStore.errorMessage) return 'bg-red-500'
  return syncStore.lastSyncAt ? 'bg-emerald-500' : 'bg-gray-400'
})

const title = computed(() =>
  syncStore.hasConflicts
    ? `${label.value} · ${translatePlural('sync.conflicts', syncStore.unresolvedCount)}`
    : label.value,
)
</script>

<template>
  <RouterLink
    :to="{ name: 'settings' }"
    class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
    :class="props.compact ? 'justify-center px-0' : ''"
    :title="title"
    :aria-label="title"
  >
    <span class="flex size-5 shrink-0 items-center justify-center">
      <span
        class="size-2 rounded-full"
        :class="dotClass"
      />
    </span>

    <span
      v-if="!props.compact"
      class="min-w-0 flex-1 truncate"
    >{{ label }}</span>

    <span
      v-if="!props.compact && syncStore.hasConflicts"
      class="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300"
    >
      {{ syncStore.unresolvedCount }}
    </span>
  </RouterLink>
</template>
