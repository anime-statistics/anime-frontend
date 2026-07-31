<script setup lang="ts">
import { useAiPanel } from '@/composables/useAiPanel'
import { useAppI18n } from '@/composables/useAppI18n'
import { useHaptic } from '@/composables/useHaptic'
import { useSettingsStore } from '@/stores/useSettingsStore'

const { translate } = useAppI18n()
const { toggle: toggleAi } = useAiPanel()
const haptic = useHaptic()
const settingsStore = useSettingsStore()

const NAV_ITEMS = [
  { name: 'home', icon: 'pi-home', labelKey: 'nav.home' },
  { name: 'search', icon: 'pi-search', labelKey: 'nav.search' },
  { name: 'tags', icon: 'pi-tags', labelKey: 'nav.tags' },
  { name: 'settings', icon: 'pi-cog', labelKey: 'nav.settings' },
] as const

function onAiTap(): void {
  haptic.lightTap()
  toggleAi()
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-gray-800 dark:bg-gray-900"
    :aria-label="translate('nav.bottomBar')"
  >
    <ul class="flex h-16 items-stretch">
      <li
        v-for="item in NAV_ITEMS"
        :key="item.name"
        class="flex-1"
      >
        <RouterLink
          :to="{ name: item.name }"
          class="flex size-full min-h-[44px] flex-col items-center justify-center gap-1 text-xs text-gray-500 transition-colors dark:text-gray-400"
          active-class="text-brand-600 dark:text-brand-300"
          @click="haptic.lightTap()"
        >
          <i :class="['pi', item.icon, 'text-base']" />
          <span>{{ translate(item.labelKey) }}</span>
        </RouterLink>
      </li>

      <li
        v-if="settingsStore.settings.isAiEnabled"
        class="flex-1"
      >
        <button
          type="button"
          class="flex size-full min-h-[44px] flex-col items-center justify-center gap-1 text-xs text-gray-500 transition-colors dark:text-gray-400"
          :aria-label="translate('ai.open')"
          @click="onAiTap"
        >
          <i class="pi pi-sparkles text-base" />
          <span>{{ translate('nav.ai') }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>
