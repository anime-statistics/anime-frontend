<script setup lang="ts">
import Rating from 'primevue/rating'
import { computed, ref, toRef } from 'vue'
import { MANGA_STATUSES, type MangaStatus } from '@/apis/dtos/mangaDto'
import EpisodeProgress from '@/components/anime/EpisodeProgress.vue'
import NotesPanel from '@/components/editor/NotesPanel.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useMangaDetail, useMangaStatusMutation } from '@/composables/useMangaQueries'
import { buildExternalUrl } from '@/core/utils/externalLinks'

type DetailTab = 'chapters' | 'notes'

const props = defineProps<{ id: string }>()

const mediaId = toRef(props, 'id')
const { translate, translatePlural } = useAppI18n()

const { data: manga, isPending, isError } = useMangaDetail(mediaId)
const statusMutation = useMangaStatusMutation()

const activeTab = ref<DetailTab>('chapters')
const hasImageError = ref(false)

const volumesRead = computed(() => manga.value?.volumesRead ?? 0)
const chaptersRead = computed(() => manga.value?.chaptersRead ?? 0)
const externalUrl = computed(() => buildExternalUrl(props.id, 'manga'))

async function patchManga(payload: {
  status?: MangaStatus
  score?: number
  volumesRead?: number
  chaptersRead?: number
}): Promise<void> {
  if (!manga.value) return

  await statusMutation.mutateAsync({
    mediaId: props.id,
    payload: {
      status: payload.status ?? manga.value.status,
      score: payload.score ?? manga.value.score,
      volumesRead: payload.volumesRead ?? volumesRead.value,
      chaptersRead: payload.chaptersRead ?? chaptersRead.value,
    },
  })
}

function onStatusChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  const status = MANGA_STATUSES.find((known) => known === value)
  if (status) void patchManga({ status })
}
</script>

<template>
  <section class="flex flex-col gap-6">
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
      <div class="flex flex-col gap-6 md:flex-row">
        <!-- The cover is the largest paint on this route; lazy-loading it would
             only delay LCP. -->
        <img
          v-if="manga.imageUrl && !hasImageError"
          :src="manga.imageUrl"
          :alt="manga.title"
          class="max-h-80 w-full rounded-lg bg-gray-200 object-cover md:w-56 dark:bg-gray-700"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          @error="hasImageError = true"
        >
        <div
          v-else
          class="flex h-56 w-full items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-300 md:h-80 md:w-56 dark:from-gray-800 dark:to-gray-700"
        >
          <i class="pi pi-book text-4xl text-brand-500 dark:text-gray-500" />
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <header class="flex flex-col gap-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ manga.title }}
            </h1>
            <p
              v-if="manga.titleJapanese"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ manga.titleJapanese }}
            </p>
          </header>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700 dark:bg-gray-800 dark:text-brand-300">
              {{ manga.source }}
            </span>
            <span class="text-gray-500 dark:text-gray-400">
              {{ translatePlural('manga.volumes', manga.volumesTotal) }}
            </span>
            <span class="text-gray-500 dark:text-gray-400">
              {{ translatePlural('manga.chapters', manga.chaptersTotal) }}
            </span>
          </div>

          <p
            v-if="manga.authors?.length"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ translate('manga.fields.authors') }}: {{ manga.authors.join(', ') }}
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm">
              <span class="text-gray-500 dark:text-gray-400">{{ translate('detail.status') }}</span>
              <select
                class="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                :value="manga.status"
                :disabled="statusMutation.isPending.value"
                @change="onStatusChange"
              >
                <option
                  v-for="status in MANGA_STATUSES"
                  :key="status"
                  :value="status"
                >
                  {{ translate(`manga.status.${status}`) }}
                </option>
              </select>
            </label>

            <div class="flex flex-col gap-1 text-sm">
              <span class="text-gray-500 dark:text-gray-400">{{ translate('detail.score') }}</span>
              <Rating
                :model-value="manga.score ?? 0"
                :stars="10"
                @update:model-value="(value) => patchManga({ score: Number(value ?? 0) })"
              />
            </div>
          </div>

          <a
            v-if="externalUrl"
            :href="externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex w-fit items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-brand-400 dark:border-gray-700"
          >
            <i class="pi pi-external-link" />
            {{ translate('detail.externalLinks') }}
          </a>
        </div>
      </div>

      <p
        v-if="manga.synopsis"
        class="max-w-prose text-sm text-gray-700 dark:text-gray-300"
      >
        {{ manga.synopsis }}
      </p>

      <div class="flex flex-col gap-4">
        <div
          class="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-800"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            class="-mb-px min-h-[44px] shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors"
            :class="activeTab === 'chapters'
              ? 'border-brand-600 text-brand-600 dark:text-brand-300'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'"
            :aria-selected="activeTab === 'chapters'"
            @click="activeTab = 'chapters'"
          >
            {{ translate('detail.chaptersRead') }}
          </button>
          <button
            type="button"
            role="tab"
            class="-mb-px min-h-[44px] shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors"
            :class="activeTab === 'notes'
              ? 'border-brand-600 text-brand-600 dark:text-brand-300'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'"
            :aria-selected="activeTab === 'notes'"
            @click="activeTab = 'notes'"
          >
            {{ translate('detail.notesTab') }}
          </button>
        </div>

        <div
          v-if="activeTab === 'chapters'"
          class="flex flex-col gap-6"
        >
          <section class="flex flex-col gap-2">
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {{ translate('detail.volumesRead') }}
            </h2>
            <EpisodeProgress
              :watched="volumesRead"
              :total="manga.volumesTotal"
              :is-busy="statusMutation.isPending.value"
              plural-key="manga.volumes"
              next-label-key="detail.markNextVolume"
              grid-label-key="detail.volumeGrid"
              item-label-key="detail.volume"
              :grid-limit="60"
              @update="(value) => patchManga({ volumesRead: value })"
            />
          </section>

          <section class="flex flex-col gap-2">
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {{ translate('detail.chaptersRead') }}
            </h2>
            <EpisodeProgress
              :watched="chaptersRead"
              :total="manga.chaptersTotal"
              :is-busy="statusMutation.isPending.value"
              plural-key="manga.chapters"
              next-label-key="detail.markNextChapter"
              grid-label-key="detail.chapterGrid"
              item-label-key="detail.chapter"
              :grid-limit="60"
              @update="(value) => patchManga({ chaptersRead: value })"
            />
          </section>
        </div>

        <NotesPanel
          v-else
          :media-id="props.id"
        />
      </div>
    </template>
  </section>
</template>
