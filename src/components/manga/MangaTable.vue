<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { useRouter } from 'vue-router'
import { MANGA_STATUSES, type IMangaSearchResultDto } from '@/apis/dtos/mangaDto'
import { useAppI18n } from '@/composables/useAppI18n'

const props = withDefaults(
  defineProps<{ items: IMangaSearchResultDto[], rows?: number }>(),
  { rows: 20 },
)

const { translate } = useAppI18n()
const router = useRouter()

function openDetail(event: { data: IMangaSearchResultDto }): void {
  void router.push({ name: 'manga-detail', params: { id: event.data.id } })
}

function statusLabel(status: string): string {
  const known = MANGA_STATUSES.find((value) => value === status)
  return known ? translate(`manga.status.${known}`) : status
}
</script>

<template>
  <DataTable
    :value="props.items"
    paginator
    :rows="props.rows"
    :rows-per-page-options="[10, 20, 50]"
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
      :header="translate('manga.title')"
      sortable
    />
    <Column
      field="source"
      :header="translate('filters.sources')"
      sortable
    />
    <Column
      field="volumesTotal"
      :header="translate('manga.fields.published')"
      sortable
    />
    <Column
      field="chaptersTotal"
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
