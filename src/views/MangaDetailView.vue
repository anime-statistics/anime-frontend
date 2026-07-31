<script setup lang="ts">
import { toRef } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useMangaDetail } from '@/composables/useMangaQueries'

const props = defineProps<{ id: string }>()

const { translate, translatePlural } = useAppI18n()
const { data: manga, isPending, isError } = useMangaDetail(toRef(props, 'id'))
</script>

<template>
  <section class="flex flex-col gap-4">
    <p
      v-if="isPending"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ translate('app.loading') }}
    </p>

    <p
      v-else-if="isError || !manga"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ translate('errors.notFound') }}
    </p>

    <template v-else>
      <header class="flex flex-col gap-1">
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ translate('pages.mangaDetailTitle') }}
        </p>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ manga.title }}
        </h1>
      </header>

      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt class="text-gray-500 dark:text-gray-400">
          {{ translate('manga.title') }}
        </dt>
        <dd class="text-gray-900 dark:text-gray-100">
          {{ translatePlural('manga.volumes', manga.volumesTotal) }},
          {{ translatePlural('manga.chapters', manga.chaptersTotal) }}
        </dd>

        <dt
          v-if="manga.authors?.length"
          class="text-gray-500 dark:text-gray-400"
        >
          {{ translate('manga.fields.authors') }}
        </dt>
        <dd
          v-if="manga.authors?.length"
          class="text-gray-900 dark:text-gray-100"
        >
          {{ manga.authors.join(', ') }}
        </dd>
      </dl>

      <p
        v-if="manga.synopsis"
        class="max-w-prose text-sm text-gray-700 dark:text-gray-300"
      >
        {{ manga.synopsis }}
      </p>
    </template>
  </section>
</template>
