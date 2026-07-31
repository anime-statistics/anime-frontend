<script setup lang="ts">
import { computed, onMounted, toRef } from 'vue'
import TagSelector from '@/components/common/TagSelector.vue'
import { useAnimeDetail, useAnimeTagMutation } from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import { useTagStore } from '@/stores/useTagStore'

const props = defineProps<{ id: string }>()

const { translate, translatePlural } = useAppI18n()
const tagStore = useTagStore()
const { data: anime, isPending, isError } = useAnimeDetail(toRef(props, 'id'))
const tagMutation = useAnimeTagMutation()

const selectedTagIds = computed({
  get: () => anime.value?.myTags ?? [],
  set: (tagIds: string[]) => {
    void tagMutation.mutateAsync({ mediaId: props.id, tagIds })
  },
})

onMounted(() => {
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})
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
      v-else-if="isError || !anime"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ translate('errors.notFound') }}
    </p>

    <template v-else>
      <header class="flex flex-col gap-1">
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ translate('pages.animeDetailTitle') }}
        </p>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ anime.title }}
        </h1>
        <p
          v-if="anime.titleJapanese"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          {{ anime.titleJapanese }}
        </p>
      </header>

      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt class="text-gray-500 dark:text-gray-400">
          {{ translate('anime.title') }}
        </dt>
        <dd class="text-gray-900 dark:text-gray-100">
          {{ translatePlural('anime.episodes', anime.episodesTotal) }}
        </dd>

        <dt class="text-gray-500 dark:text-gray-400">
          {{ translate('anime.fields.score') }}
        </dt>
        <dd class="text-gray-900 dark:text-gray-100">
          {{ anime.score ?? '—' }}
        </dd>

        <dt
          v-if="anime.genres?.length"
          class="text-gray-500 dark:text-gray-400"
        >
          {{ translate('anime.fields.genres') }}
        </dt>
        <dd
          v-if="anime.genres?.length"
          class="text-gray-900 dark:text-gray-100"
        >
          {{ anime.genres.join(', ') }}
        </dd>
      </dl>

      <p
        v-if="anime.synopsis"
        class="max-w-prose text-sm text-gray-700 dark:text-gray-300"
      >
        {{ anime.synopsis }}
      </p>

      <section class="flex max-w-sm flex-col gap-1">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {{ translate('tags.title') }}
        </h2>
        <TagSelector v-model="selectedTagIds" />
      </section>
    </template>
  </section>
</template>
