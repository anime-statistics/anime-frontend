<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const { translate } = useAppI18n()
const { isOnline } = useOnlineStatus()
</script>

<template>
  <div
    v-if="!isOnline"
    class="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm text-white"
    role="status"
    aria-live="polite"
  >
    <i class="pi pi-wifi" />
    <span>{{ translate('offline.banner') }}</span>
  </div>
</template>
