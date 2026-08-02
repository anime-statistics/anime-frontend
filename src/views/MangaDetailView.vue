<script setup lang="ts">
import Rating from 'primevue/rating'
import { computed, onMounted, ref, toRef } from 'vue'
import type { IExternalLinkDto } from '@/apis/dtos/externalLinkDto'
import ExternalLinksPanel from '@/components/common/ExternalLinksPanel.vue'
import TagSelector from '@/components/common/TagSelector.vue'
import EpisodeProgress from '@/components/anime/EpisodeProgress.vue'
import NotesPanel from '@/components/editor/NotesPanel.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import {
  useMangaDetail,
  useMangaLinksMutation,
  useMangaProgressMutation,
  useMangaTagMutation,
} from '@/composables/useMangaQueries'
import { useToast } from '@/composables/useToast'
import { primaryTitle } from '@/core/utils/mediaTitle'
import { useTagStore } from '@/stores/useTagStore'

type DetailTab = 'chapters' | 'notes'

const props = defineProps<{ id: string }>()

const mediaId = toRef(props, 'id')
const { translate, translatePlural, locale } = useAppI18n()
const tagStore = useTagStore()
const toast = useToast()

const { data: manga, isPending, isError } = useMangaDetail(mediaId)
const progressMutation = useMangaProgressMutation()
const tagMutation = useMangaTagMutation()
const linksMutation = useMangaLinksMutation()

const activeTab = ref<DetailTab>('chapters')
const hasImageError = ref(false)

const displayTitle = computed(() =>
  manga.value ? primaryTitle(manga.value, locale.value) : '',
)
const volumesRead = computed(() => manga.value?.volumesRead ?? 0)
const chaptersRead = computed(() => manga.value?.chaptersRead ?? 0)

async function saveLinks(externalLinks: IExternalLinkDto[]): Promise<void> {
  try {
    await linksMutation.mutateAsync({ mediaId: props.id, externalLinks })
    toast.success(translate('detail.links.saved'))
  } catch {
    toast.error(translate('detail.links.saveFailed'))
  }
}

const selectedTagIds = computed({
  get: () => manga.value?.myTags ?? [],
  set: (tagIds: string[]) => {
    void tagMutation.mutateAsync({ mediaId: props.id, tagIds })
  },
})

// Clearing every tag is what fully drops the title out of the collection.
async function removeFromCollection(): Promise<void> {
  try {
    await tagMutation.mutateAsync({ mediaId: props.id, tagIds: [] })
    toast.success(translate('collection.removed', { title: displayTitle.value }))
  } catch {
    toast.error(translate('collection.removeFailed'))
  }
}

onMounted(() => {
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})

async function patchManga(payload: {
  score?: number
  volumesRead?: number
  chaptersRead?: number
}): Promise<void> {
  if (!manga.value) return

  await progressMutation.mutateAsync({
    mediaId: props.id,
    payload: {
      score: payload.score ?? manga.value.score,
      volumesRead: payload.volumesRead ?? volumesRead.value,
      chaptersRead: payload.chaptersRead ?? chaptersRead.value,
    },
  })
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
          :alt="displayTitle"
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
              {{ displayTitle }}
            </h1>
            <p
              v-if="manga.title !== displayTitle"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ manga.title }}
            </p>
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
            <div class="flex flex-col gap-1 text-sm">
              <span class="text-gray-500 dark:text-gray-400">{{ translate('tags.title') }}</span>
              <TagSelector v-model="selectedTagIds" />
              <span
                v-if="selectedTagIds.length === 0"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                {{ translate('collection.notInCollection') }}
              </span>
              <button
                v-else
                type="button"
                class="mt-1 inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-500 dark:hover:text-red-400"
                :disabled="tagMutation.isPending.value"
                @click="removeFromCollection"
              >
                <i class="pi pi-times" />
                {{ translate('collection.remove') }}
              </button>
            </div>

            <div class="flex flex-col gap-1 text-sm">
              <span class="text-gray-500 dark:text-gray-400">{{ translate('detail.score') }}</span>
              <Rating
                :model-value="manga.score ?? 0"
                :stars="10"
                @update:model-value="(value) => patchManga({ score: Number(value ?? 0) })"
              />
            </div>
          </div>

          <ExternalLinksPanel
            :media-id="props.id"
            kind="manga"
            :links="manga.externalLinks"
            :is-busy="linksMutation.isPending.value"
            class="max-w-md"
            @save="saveLinks"
          />
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
              :is-busy="progressMutation.isPending.value"
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
              :is-busy="progressMutation.isPending.value"
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
