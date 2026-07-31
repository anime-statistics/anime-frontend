<script setup lang="ts">
import Rating from 'primevue/rating'
import { computed, onMounted, ref, toRef } from 'vue'
import { ANIME_STATUSES, type AnimeStatus } from '@/apis/dtos/animeDto'
import EpisodeProgress from '@/components/anime/EpisodeProgress.vue'
import WatchHistory from '@/components/anime/WatchHistory.vue'
import TagSelector from '@/components/common/TagSelector.vue'
import NotesList from '@/components/editor/NotesList.vue'
import { useAnimeDetail, useAnimeStatusMutation, useAnimeTagMutation } from '@/composables/useAnimeQueries'
import { useAppI18n } from '@/composables/useAppI18n'
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
} from '@/composables/useNoteQueries'
import { useToast } from '@/composables/useToast'
import { DEFAULT_EPISODE_MINUTES, useWatchHistory } from '@/composables/useWatchHistory'
import { buildExternalUrl } from '@/core/utils/externalLinks'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTagStore } from '@/stores/useTagStore'

type DetailTab = 'episodes' | 'notes' | 'history'

const props = defineProps<{ id: string }>()

const mediaId = toRef(props, 'id')
const { translate, translatePlural } = useAppI18n()
const tagStore = useTagStore()
const settingsStore = useSettingsStore()
const toast = useToast()

const { data: anime, isPending, isError } = useAnimeDetail(mediaId)
const statusMutation = useAnimeStatusMutation()
const tagMutation = useAnimeTagMutation()

const notesQuery = useNotes(mediaId)
const createNote = useCreateNote(mediaId)
const updateNote = useUpdateNote(mediaId)
const deleteNote = useDeleteNote(mediaId)

const history = useWatchHistory(mediaId)

const activeTab = ref<DetailTab>('episodes')
const hasImageError = ref(false)

const TABS = [
  { value: 'episodes', labelKey: 'detail.episodesTab' },
  { value: 'notes', labelKey: 'detail.notesTab' },
  { value: 'history', labelKey: 'detail.historyTab' },
] as const

const watchedEpisodes = computed(() => anime.value?.watchedEpisodes ?? 0)
const externalUrl = computed(() => buildExternalUrl(props.id, 'anime'))
const isNotified = computed(() => settingsStore.isNotified(props.id))

const selectedTagIds = computed({
  get: () => anime.value?.myTags ?? [],
  set: (tagIds: string[]) => {
    void tagMutation.mutateAsync({ mediaId: props.id, tagIds })
  },
})

onMounted(() => {
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})

async function patchAnime(payload: {
  status?: AnimeStatus
  score?: number
  watchedEpisodes?: number
}): Promise<void> {
  if (!anime.value) return

  await statusMutation.mutateAsync({
    mediaId: props.id,
    payload: {
      status: payload.status ?? anime.value.status,
      score: payload.score ?? anime.value.score,
      watchedEpisodes: payload.watchedEpisodes ?? watchedEpisodes.value,
    },
  })
}

function onStatusChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  const status = ANIME_STATUSES.find((known) => known === value)
  if (status) void patchAnime({ status })
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
      <div class="flex flex-col gap-6 md:flex-row">
        <img
          v-if="anime.imageUrl && !hasImageError"
          :src="anime.imageUrl"
          :alt="anime.title"
          class="max-h-80 w-full rounded-lg object-cover md:w-56"
          @error="hasImageError = true"
        >
        <div
          v-else
          class="flex h-56 w-full items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-300 md:h-80 md:w-56 dark:from-gray-800 dark:to-gray-700"
        >
          <i class="pi pi-image text-4xl text-brand-500 dark:text-gray-500" />
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <header class="flex flex-col gap-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ anime.title }}
            </h1>
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

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm">
              <span class="text-gray-500 dark:text-gray-400">{{ translate('detail.status') }}</span>
              <select
                class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
                :value="anime.status"
                :disabled="statusMutation.isPending.value"
                @change="onStatusChange"
              >
                <option
                  v-for="status in ANIME_STATUSES"
                  :key="status"
                  :value="status"
                >
                  {{ translate(`anime.status.${status}`) }}
                </option>
              </select>
            </label>

            <div class="flex flex-col gap-1 text-sm">
              <span class="text-gray-500 dark:text-gray-400">{{ translate('detail.score') }}</span>
              <Rating
                :model-value="anime.score ?? 0"
                :stars="10"
                @update:model-value="(value) => patchAnime({ score: Number(value ?? 0) })"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1 text-sm">
            <span class="text-gray-500 dark:text-gray-400">{{ translate('tags.title') }}</span>
            <TagSelector
              v-model="selectedTagIds"
              class="max-w-sm"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <a
              v-if="externalUrl"
              :href="externalUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-brand-400 dark:border-gray-700"
            >
              <i class="pi pi-external-link" />
              {{ translate('detail.externalLinks') }}
            </a>

            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
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

      <div class="flex flex-col gap-4">
        <div
          class="flex gap-1 border-b border-gray-200 dark:border-gray-800"
          role="tablist"
        >
          <button
            v-for="tab in TABS"
            :key="tab.value"
            type="button"
            role="tab"
            class="-mb-px border-b-2 px-3 py-2 text-sm transition-colors"
            :class="activeTab === tab.value
              ? 'border-brand-600 text-brand-600 dark:text-brand-300'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
            :aria-selected="activeTab === tab.value"
            @click="activeTab = tab.value"
          >
            {{ translate(tab.labelKey) }}
          </button>
        </div>

        <EpisodeProgress
          v-if="activeTab === 'episodes'"
          :watched="watchedEpisodes"
          :total="anime.episodesTotal"
          :is-busy="statusMutation.isPending.value"
          @update="onProgressUpdate"
        />

        <NotesList
          v-else-if="activeTab === 'notes'"
          :notes="notesQuery.data.value ?? []"
          :is-busy="createNote.isPending.value"
          @create="(content) => createNote.mutate({ mediaId: props.id, content })"
          @update="(payload) => updateNote.mutate(payload)"
          @remove="(id) => deleteNote.mutate(id)"
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
