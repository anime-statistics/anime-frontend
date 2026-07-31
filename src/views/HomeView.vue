<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppI18n } from '@/composables/useAppI18n'

const route = useRoute()
const { translate } = useAppI18n()

const mediaType = computed(() => (route.query.type === 'manga' ? 'manga' : 'anime'))
</script>

<template>
  <section class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ translate('pages.homeTitle') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ translate('pages.homeSubtitle') }}
      </p>
    </header>

    <p class="text-sm text-gray-600 dark:text-gray-300">
      {{ mediaType === 'manga' ? translate('manga.title') : translate('anime.title') }}
    </p>
  </section>
</template>
