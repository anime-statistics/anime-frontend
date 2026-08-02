<script setup lang="ts">
import Rating from 'primevue/rating'
import { computed, onMounted, ref, toRef } from 'vue'
import type { IExternalLinkDto } from '@/apis/dtos/externalLinkDto'
import EpisodeProgress from '@/components/anime/EpisodeProgress.vue'
import WatchHistory from '@/components/anime/WatchHistory.vue'
import ExternalLinksPanel from '@/components/common/ExternalLinksPanel.vue'
import TagSelector from '@/components/common/TagSelector.vue'
import NotesPanel from '@/components/editor/NotesPanel.vue'
import {
  useAnimeDetail,
  useAnimeLinksMutation,
  useAnimeProgressMutation,
  useAnimeTagMutation,
} from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import { useToast } from '@/composables/useToast'
import { DEFAULT_EPISODE_MINUTES, useWatchHistory } from '@/composables/useWatchHistory'
import { primaryTitle } from '@/core/utils/mediaTitle'
import { totalRuntime, type IRuntime } from '@/core/utils/runtime'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTagStore } from '@/stores/useTagStore'

type DetailTab = 'notes' | 'history'

const props = defineProps<{ id: string }>()

const mediaId = toRef(props, 'id')
const { translate, translatePlural, locale } = useAppI18n()
const tagStore = useTagStore()
const settingsStore = useSettingsStore()
const toast = useToast()

const { data: anime, isPending, isError } = useAnimeDetail(mediaId)
const progressMutation = useAnimeProgressMutation()
const tagMutation = useAnimeTagMutation()
const linksMutation = useAnimeLinksMutation()

const history = useWatchHistory(mediaId)

const activeTab = ref<DetailTab>('notes')
const hasImageError = ref(false)

// Episode progress is an action on the title, so it lives in the side panel
// with the rest; the tabs below are the long-form content.
const TABS = [
  { value: 'notes', labelKey: 'detail.notesTab' },
  { value: 'history', labelKey: 'detail.historyTab' },
] as const

const displayTitle = computed(() =>
  anime.value ? primaryTitle(anime.value, locale.value) : '',
)
const watchedEpisodes = computed(() => anime.value?.watchedEpisodes ?? 0)

// How much of your life this title asks for, and how much it already took.
const runtime = computed(() =>
  totalRuntime(anime.value?.episodesTotal, anime.value?.duration),
)
const watchedRuntime = computed(() =>
  totalRuntime(watchedEpisodes.value, anime.value?.duration),
)

function formatRuntime(value: IRuntime): string {
  return value.hours
    ? translate('detail.runtimeHm', { hours: value.hours, minutes: value.minutes })
    : translate('detail.runtimeM', { minutes: value.minutes })
}

const isNotified = computed(() => settingsStore.isNotified(props.id))

async function saveLinks(externalLinks: IExternalLinkDto[]): Promise<void> {
  try {
    await linksMutation.mutateAsync({ mediaId: props.id, externalLinks })
    toast.success(translate('detail.links.saved'))
  } catch {
    toast.error(translate('detail.links.saveFailed'))
  }
}

const selectedTagIds = computed({
  get: () => anime.value?.myTags ?? [],
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

async function patchAnime(payload: { score?: number, watchedEpisodes?: number }): Promise<void> {
  if (!anime.value) return

  await progressMutation.mutateAsync({
    mediaId: props.id,
    payload: {
      score: payload.score ?? anime.value.score,
      watchedEpisodes: payload.watchedEpisodes ?? watchedEpisodes.value,
    },
  })
}

async function onProgressUpdate(next: number): Promise<void> {
  const delta = next - watchedEpisodes.value
  await patchAnime({ watchedEpisodes: next })

  if (delta > 0) {
    history.record({
      mediaId: props.id,
      episodes: delta,
      minutes: delta * (anime.value?.duration ?? DEFAULT_EPISODE_MINUTES),
    })
  }
}

async function toggleNotifications(): Promise<void> {
  const willEnable = !isNotified.value

  if (willEnable && typeof Notification !== 'undefined') {
    const permission = await Notification.requestPermission()
    if (permission === 'denied') {
      toast.error(translate('detail.notifyDenied'))
      return
    }
  }

  settingsStore.toggleNotify(props.id)
  settingsStore.persist()
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
      v-else-if="isError || !anime"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ translate('errors.notFound') }}
    </p>

    <template v-else>
      <!-- Two columns: what the title is on the left, what you do with it on the
           right. The tabs below stay full width, because the notes editor is the
           reason this page is ever open for long and it deserves the room. -->
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="flex min-w-0 flex-col gap-5">
          <div class="flex flex-col gap-6 sm:flex-row">
            <!-- The poster is the largest paint on this route; lazy-loading it
                 would only delay LCP. -->
            <img
              v-if="anime.imageUrl && !hasImageError"
              :src="anime.imageUrl"
              :alt="displayTitle"
              class="max-h-80 w-full rounded-lg bg-gray-200 object-cover sm:w-56 dark:bg-gray-700"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              @error="hasImageError = true"
            >
            <div
              v-else
              class="flex h-56 w-full items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-300 sm:h-80 sm:w-56 dark:from-gray-800 dark:to-gray-700"
            >
              <i class="pi pi-image text-4xl text-brand-500 dark:text-gray-500" />
            </div>

            <div class="flex min-w-0 flex-1 flex-col gap-3">
              <header class="flex flex-col gap-1">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {{ displayTitle }}
                </h1>
                <p
                  v-if="anime.title !== displayTitle"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ anime.title }}
                </p>
                <p
                  v-if="anime.titleJapanese"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ anime.titleJapanese }}
                </p>
                <p
                  v-if="anime.titleEnglish && anime.titleEnglish !== anime.title"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ anime.titleEnglish }}
                </p>
              </header>

              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700 dark:bg-gray-800 dark:text-brand-300">
                  {{ anime.source }}
                </span>
                <span
                  v-if="anime.secondarySource"
                  class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  {{ anime.secondarySource }}
                </span>
                <span
                  v-if="anime.rating"
                  class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  {{ anime.rating }}
                </span>
                <span class="text-gray-500 dark:text-gray-400">
                  {{ translatePlural('anime.episodes', anime.episodesTotal) }}
                </span>
                <span
                  v-if="anime.airedFrom"
                  class="text-gray-500 dark:text-gray-400"
                >
                  {{ anime.airedFrom.slice(0, 4) }}
                </span>
              </div>

              <dl
                v-if="runtime"
                class="flex flex-wrap gap-x-6 gap-y-1 text-xs"
              >
                <div class="flex items-center gap-1.5">
                  <dt class="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <i class="pi pi-clock" />
                    {{ translate('detail.runtimeTotal') }}
                  </dt>
                  <dd class="font-medium text-gray-800 dark:text-gray-100">
                    {{ formatRuntime(runtime) }}
                    <span class="font-normal text-gray-400 dark:text-gray-500">
                      · {{ translate('detail.runtimeM', { minutes: runtime.totalMinutes }) }}
                    </span>
                  </dd>
                </div>
                <div
                  v-if="watchedRuntime"
                  class="flex items-center gap-1.5"
                >
                  <dt class="text-gray-500 dark:text-gray-400">
                    {{ translate('detail.runtimeSpent') }}
                  </dt>
                  <dd class="font-medium text-gray-800 dark:text-gray-100">
                    {{ formatRuntime(watchedRuntime) }}
                  </dd>
                </div>
              </dl>

              <div
                v-if="anime.genres?.length"
                class="flex flex-wrap gap-1"
              >
                <span
                  v-for="genre in anime.genres"
                  :key="genre"
                  class="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"
                >
                  {{ genre }}
                </span>
              </div>
            </div>
          </div>

          <p
            v-if="anime.synopsis"
            class="max-w-prose text-sm text-gray-700 dark:text-gray-300"
          >
            {{ anime.synopsis }}
          </p>

          <section
            v-if="anime.relatedAnime?.length"
            class="flex flex-col gap-2"
          >
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {{ translate('detail.related') }}
            </h2>
            <ul class="flex flex-col gap-1 text-sm">
              <li
                v-for="related in anime.relatedAnime"
                :key="related.id"
              >
                <RouterLink
                  :to="{ name: 'anime-detail', params: { id: related.id } }"
                  class="text-brand-600 hover:underline dark:text-brand-300"
                >
                  {{ related.title }}
                </RouterLink>
                <span class="text-gray-500 dark:text-gray-400"> · {{ related.relation }}</span>
              </li>
            </ul>
          </section>
        </div>

        <aside
          class="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 lg:sticky lg:top-20 lg:self-start dark:border-gray-800"
          :aria-label="translate('detail.actions')"
        >
          <div class="flex flex-col gap-1 text-sm">
            <!-- Watch status lives in the tag picker: a title can sit in several
                 at once, so there is nothing left for a single-choice select. -->
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
              :model-value="anime.score ?? 0"
              :stars="10"
              @update:model-value="(value) => patchAnime({ score: Number(value ?? 0) })"
            />
          </div>

          <div class="flex flex-col gap-1 border-t border-gray-200 pt-4 text-sm dark:border-gray-800">
            <span class="text-gray-500 dark:text-gray-400">{{ translate('detail.episodesTab') }}</span>
            <EpisodeProgress
              :watched="watchedEpisodes"
              :total="anime.episodesTotal"
              :is-busy="progressMutation.isPending.value"
              @update="onProgressUpdate"
            />
          </div>

          <div class="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <ExternalLinksPanel
              :media-id="props.id"
              kind="anime"
              :links="anime.externalLinks"
              :is-busy="linksMutation.isPending.value"
              @save="saveLinks"
            />

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
              :class="isNotified
                ? 'border-brand-500 text-brand-600 dark:text-brand-300'
                : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'"
              :aria-pressed="isNotified"
              :title="translate('detail.notify')"
              @click="toggleNotifications"
            >
              <i :class="['pi', isNotified ? 'pi-bell' : 'pi-bell-slash']" />
              {{ isNotified ? translate('detail.notifyEnabled') : translate('detail.notifyDisabled') }}
            </button>
          </div>
        </aside>
      </div>

      <div class="flex flex-col gap-4">
        <div
          class="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-800"
          role="tablist"
        >
          <button
            v-for="tab in TABS"
            :key="tab.value"
            type="button"
            role="tab"
            class="-mb-px min-h-[44px] shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors"
            :class="activeTab === tab.value
              ? 'border-brand-600 text-brand-600 dark:text-brand-300'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
            :aria-selected="activeTab === tab.value"
            @click="activeTab = tab.value"
          >
            {{ translate(tab.labelKey) }}
          </button>
        </div>

        <NotesPanel
          v-if="activeTab === 'notes'"
          :media-id="props.id"
        />

        <WatchHistory
          v-else
          :entries="history.entries.value"
          :stats="history.stats.value"
          @clear="history.clear"
        />
      </div>
    </template>
  </section>
</template>
