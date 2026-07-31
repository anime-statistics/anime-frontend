<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'
import { useSettingsStore } from '@/stores/useSettingsStore'

const { translate } = useAppI18n()
const settingsStore = useSettingsStore()
</script>

<template>
  <section class="flex max-w-xl flex-col gap-4">
    <header>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ translate('pages.settingsTitle') }}
      </h1>
    </header>

    <dl class="grid grid-cols-2 gap-2 text-sm">
      <dt class="text-gray-500 dark:text-gray-400">
        {{ translate('app.language') }}
      </dt>
      <dd class="text-gray-900 dark:text-gray-100">
        {{ settingsStore.locale }}
      </dd>

      <dt class="text-gray-500 dark:text-gray-400">
        {{ translate('settings.viewMode') }}
      </dt>
      <dd class="text-gray-900 dark:text-gray-100">
        {{ settingsStore.viewMode }}
      </dd>

      <dt class="text-gray-500 dark:text-gray-400">
        {{ translate('settings.columns') }}
      </dt>
      <dd class="text-gray-900 dark:text-gray-100">
        {{ settingsStore.columns }}
      </dd>

      <dt class="text-gray-500 dark:text-gray-400">
        {{ translate('settings.pageSize') }}
      </dt>
      <dd class="text-gray-900 dark:text-gray-100">
        {{ settingsStore.settings.pageSize }}
      </dd>
    </dl>
  </section>
</template>
