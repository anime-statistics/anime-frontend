<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { useRouter } from 'vue-router'
import { ANIME_STATUSES } from '@/apis/dtos/animeDto'
import { useAppI18n } from '@/composables/useAppI18n'
import { useIsMobile } from '@/composables/useMediaQuery'
import { primaryTitle } from '@/core/utils/mediaTitle'
import type { IMergedAnimeSearchResult } from '@/mocks/mediaAdapter'

const props = withDefaults(
  defineProps<{ items: IMergedAnimeSearchResult[], rows?: number }>(),
  { rows: 20 },
)

const { translate, locale } = useAppI18n()
const router = useRouter()
const isMobile = useIsMobile()

function displayTitle(item: IMergedAnimeSearchResult): string {
  return primaryTitle(item, locale.value)
}

function openDetail(event: { data: IMergedAnimeSearchResult }): void {
  void router.push({ name: 'anime-detail', params: { id: event.data.id } })
}

function statusLabel(status: string): string {
  const known = ANIME_STATUSES.find((value) => value === status)
  return known ? translate(`anime.status.${known}`) : status
}
</script>

<template>
  <ul
    v-if="isMobile"
    class="flex flex-col gap-2"
    data-testid="anime-table-cards"
  >
    <li
      v-for="item in props.items"
      :key="item.id"
      class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
    >
      <RouterLink
        :to="{ name: 'anime-detail', params: { id: item.id } }"
        class="block min-h-[44px] text-sm font-semibold text-gray-900 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-300"
      >
        {{ displayTitle(item) }}
      </RouterLink>

      <dl class="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div class="flex justify-between gap-2">
          <dt class="text-gray-500 dark:text-gray-400">
            {{ translate('filters.sources') }}
          </dt>
          <dd class="truncate">
            {{ item.source }}
          </dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt class="text-gray-500 dark:text-gray-400">
            {{ translate('sort.episodes') }}
          </dt>
          <dd>{{ item.episodesTotal }}</dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt class="text-gray-500 dark:text-gray-400">
            {{ translate('filters.status') }}
          </dt>
          <dd class="truncate">
            {{ statusLabel(item.status) }}
          </dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt class="text-gray-500 dark:text-gray-400">
            {{ translate('anime.fields.score') }}
          </dt>
          <dd>{{ item.score ?? '—' }}</dd>
        </div>
      </dl>
    </li>
  </ul>

  <DataTable
    v-else
    :value="props.items"
    paginator
    :rows="props.rows"
    :rows-per-page-options="[10, 20, 50]"
    striped-rows
    sort-field="title"
    :sort-order="1"
    selection-mode="single"
    data-key="id"
    responsive-layout="scroll"
    class="text-sm"
    @row-select="openDetail"
  >
    <Column
      field="title"
      :header="translate('anime.title')"
      sortable
    >
      <template #body="{ data }">
        {{ displayTitle(data) }}
      </template>
    </Column>
    <Column
      field="source"
      :header="translate('filters.sources')"
      sortable
    />
    <Column
      field="episodesTotal"
      :header="translate('sort.episodes')"
      sortable
    />
    <Column
      field="status"
      :header="translate('filters.status')"
      sortable
    >
      <template #body="{ data }">
        {{ statusLabel(data.status) }}
      </template>
    </Column>
    <Column
      field="score"
      :header="translate('anime.fields.score')"
      sortable
    />
  </DataTable>
</template>
