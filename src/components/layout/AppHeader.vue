<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppI18n } from '@/composables/useAppI18n'
import { useSettingsStore } from '@/stores/useSettingsStore'

const props = defineProps<{ isSidebarCollapsed: boolean }>()
const emit = defineEmits<{ toggleMenu: [], toggleSidebar: [] }>()

const route = useRoute()
const settingsStore = useSettingsStore()
const { translate, locale } = useAppI18n()

const mediaType = computed(() => (route.query.type === 'manga' ? 'manga' : 'anime'))
const isDark = computed(() => settingsStore.prefersDark)

function toggleTheme(): void {
  settingsStore.setTheme(isDark.value ? 'light' : 'dark')
}

function toggleLocale(): void {
  const next = settingsStore.locale === 'ru' ? 'en' : 'ru'
  settingsStore.setLocale(next)
  locale.value = next
}
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-gray-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/90"
  >
    <div class="mx-auto flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <button
        type="button"
        class="flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
        :aria-label="translate('layout.openMenu')"
        @click="emit('toggleMenu')"
      >
        <i class="pi pi-bars" />
      </button>

      <button
        type="button"
        class="hidden size-11 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:flex dark:text-gray-300 dark:hover:bg-gray-800"
        :aria-label="props.isSidebarCollapsed
          ? translate('layout.expandSidebar')
          : translate('layout.collapseSidebar')"
        :title="props.isSidebarCollapsed
          ? translate('layout.expandSidebar')
          : translate('layout.collapseSidebar')"
        :aria-pressed="props.isSidebarCollapsed"
        @click="emit('toggleSidebar')"
      >
        <!-- Panel-with-arrow, the shape browsers use for their own sidebar toggle. -->
        <svg
          class="size-5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect
            x="2.5"
            y="3.5"
            width="15"
            height="13"
            rx="2.5"
          />
          <line
            x1="7.5"
            y1="3.5"
            x2="7.5"
            y2="16.5"
          />
          <polyline :points="props.isSidebarCollapsed ? '11.5 7.5 14 10 11.5 12.5' : '14 7.5 11.5 10 14 12.5'" />
        </svg>
      </button>

      <RouterLink
        :to="{ name: 'home' }"
        class="flex items-center gap-2 font-semibold text-brand-600 dark:text-brand-300"
        :aria-label="translate('app.title')"
      >
        <i class="pi pi-play-circle" />
        <span class="hidden sm:inline">{{ translate('app.title') }}</span>
      </RouterLink>

      <nav
        class="ml-2 hidden items-center gap-1 rounded-lg bg-gray-100 p-1 sm:flex dark:bg-gray-800"
        :aria-label="translate('nav.home')"
      >
        <RouterLink
          :to="{ name: 'home', query: { type: 'anime' } }"
          class="rounded-md px-3 py-1 text-sm transition-colors"
          :class="mediaType === 'anime'
            ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-300'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'"
        >
          {{ translate('nav.anime') }}
        </RouterLink>
        <RouterLink
          :to="{ name: 'home', query: { type: 'manga' } }"
          class="rounded-md px-3 py-1 text-sm transition-colors"
          :class="mediaType === 'manga'
            ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-300'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'"
        >
          {{ translate('nav.manga') }}
        </RouterLink>
      </nav>

      <RouterLink
        :to="{ name: 'search' }"
        class="ml-auto flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-brand-400 sm:min-h-0 sm:max-w-md dark:border-gray-700 dark:text-gray-400"
        :title="`${translate('nav.search')} (Ctrl+K)`"
      >
        <i class="pi pi-search shrink-0" />
        <span class="truncate">{{ translate('anime.search.placeholder') }}</span>
      </RouterLink>

      <div class="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          :aria-label="translate('layout.toggleTheme')"
          @click="toggleTheme"
        >
          <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" />
        </button>
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-lg text-xs font-medium uppercase text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          :aria-label="`${settingsStore.locale.toUpperCase()} — ${translate('layout.toggleLocale')}`"
          @click="toggleLocale"
        >
          {{ settingsStore.locale }}
        </button>
        <RouterLink
          :to="{ name: 'settings' }"
          class="hidden size-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:flex dark:text-gray-300 dark:hover:bg-gray-800"
          :aria-label="translate('nav.settings')"
        >
          <i class="pi pi-cog" />
        </RouterLink>
      </div>
    </div>
  </header>
</template>
