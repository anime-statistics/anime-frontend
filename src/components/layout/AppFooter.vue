<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'

const { translate } = useAppI18n()
const appVersion = __APP_VERSION__
</script>

<template>
  <!-- Sync state used to live here, at the very bottom of a scrolling page.
       It belongs where it is always on screen, so it moved to the sidebar. -->
  <footer
    class="border-t border-gray-200 px-4 pb-20 pt-3 text-xs text-gray-500 md:pb-3 dark:border-gray-800 dark:text-gray-400"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span>{{ translate('footer.version', { version: appVersion }) }}</span>
      <span>{{ translate('footer.rights') }}</span>
    </div>
  </footer>
</template>
