<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'

const { translate } = useAppI18n()

const NAV_ITEMS = [
  { name: 'home', icon: 'pi-home', labelKey: 'nav.home' },
  { name: 'search', icon: 'pi-search', labelKey: 'nav.search' },
  { name: 'tags', icon: 'pi-tags', labelKey: 'nav.tags' },
  { name: 'settings', icon: 'pi-cog', labelKey: 'nav.settings' },
] as const
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-gray-800 dark:bg-gray-900"
    :aria-label="translate('nav.home')"
  >
    <ul class="flex">
      <li
        v-for="item in NAV_ITEMS"
        :key="item.name"
        class="flex-1"
      >
        <RouterLink
          :to="{ name: item.name }"
          class="flex flex-col items-center gap-1 py-2 text-xs text-gray-500 transition-colors dark:text-gray-400"
          active-class="text-brand-600 dark:text-brand-300"
        >
          <i :class="['pi', item.icon, 'text-base']" />
          <span>{{ translate(item.labelKey) }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
