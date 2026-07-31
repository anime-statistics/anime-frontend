<script setup lang="ts">
import { useAppI18n } from '@/composables/useAppI18n'

const { translate } = useAppI18n()
</script>

<template>
  <section class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <i class="pi pi-compass text-4xl text-gray-400" />
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {{ translate('pages.notFoundTitle') }}
    </h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      {{ translate('pages.notFoundHint') }}
    </p>
    <RouterLink
      :to="{ name: 'home' }"
      class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
    >
      {{ translate('pages.backHome') }}
    </RouterLink>
  </section>
</template>
