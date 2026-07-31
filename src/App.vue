<script setup lang="ts">
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settingsStore = useSettingsStore()
const { translate } = useAppI18n()

const isDark = computed(() => settingsStore.prefersDark)

function toggleTheme(): void {
  settingsStore.setTheme(isDark.value ? 'light' : 'dark')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
    <h1 class="text-3xl font-bold text-brand-600 dark:text-brand-300">
      {{ translate('app.title') }}
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Проект инициализирован.
    </p>
    <button
      type="button"
      class="rounded-lg bg-brand-600 px-4 py-2 text-white transition-colors hover:bg-brand-700"
      @click="toggleTheme"
    >
      {{ isDark ? translate('app.themeLight') : translate('app.themeDark') }}
    </button>
  </div>
</template>
