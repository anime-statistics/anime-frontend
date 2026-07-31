<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { useRouter } from 'vue-router'
import { ANIME_STATUSES } from '@/apis/dtos/animeDto'
import { useAppI18n } from '@/composables/useAppI18n'
import type { IMergedAnimeSearchResult } from '@/mocks/mediaAdapter'

const props = withDefaults(
  defineProps<{ items: IMergedAnimeSearchResult[], rows?: number }>(),
  { rows: 20 },
)

const { translate } = useAppI18n()
const router = useRouter()

function openDetail(event: { data: IMergedAnimeSearchResult }): void {
  void router.push({ name: 'anime-detail', params: { id: event.data.id } })
}

function statusLabel(status: string): string {
  const known = ANIME_STATUSES.find((value) => value === status)
  return known ? translate(`anime.status.${known}`) : status
}
</script>

<template>
  <DataTable
    :value="props.items"
    paginator
    :rows="props.rows"
    striped-rows
    sort-field="title"
    :sort-order="1"
    selection-mode="single"
    data-key="id"
    class="text-sm"
    @row-select="openDetail"
  >
    <Column
      field="title"
      :header="translate('anime.title')"
      sortable
    />
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
