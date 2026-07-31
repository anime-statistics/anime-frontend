<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useTagStore } from '@/stores/useTagStore'

const { translate, translatePlural } = useAppI18n()
const tagStore = useTagStore()

onMounted(() => {
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})
</script>

<template>
  <section class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ translate('pages.tagsTitle') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ translatePlural('tags.count', tagStore.tags.length) }}
      </p>
    </header>

    <p
      v-if="tagStore.isLoading"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('app.loading') }}
    </p>

    <p
      v-else-if="tagStore.errorMessage"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ tagStore.errorMessage }}
    </p>

    <ul
      v-else
      class="flex flex-wrap gap-2"
    >
      <li
        v-for="tag in tagStore.tags"
        :key="tag.id"
        class="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm dark:border-gray-700"
        :class="tag.isHidden ? 'opacity-50' : ''"
      >
        <span
          class="size-2.5 rounded-full"
          :style="{ backgroundColor: tag.color }"
        />
        {{ tag.name }}
      </li>
    </ul>
  </section>
</template>
