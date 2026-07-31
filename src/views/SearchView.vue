<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'

const { translate } = useAppI18n()
</script>

<template>
  <section class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ translate('pages.searchTitle') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ translate('pages.searchHint') }}
      </p>
    </header>
  </section>
</template>
