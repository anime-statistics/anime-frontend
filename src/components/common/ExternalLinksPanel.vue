<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { computed, ref } from 'vue'
import { MEDIA_SOURCES } from '@/apis/dtos/animeDto'
import type { IExternalLinkDto } from '@/apis/dtos/externalLinkDto'
import { useAppI18n } from '@/composables/useAppI18n'
import { buildExternalUrl, ensureApiUrl, type MediaKind } from '@/core/utils/externalLinks'
import { parseMediaId } from '@/core/utils/slugGenerator'

const props = defineProps<{
  mediaId: string
  kind: MediaKind
  links?: IExternalLinkDto[]
  isBusy?: boolean
}>()
const emit = defineEmits<{ save: [IExternalLinkDto[]] }>()

const { translate } = useAppI18n()

// Saved links win; otherwise the address derived from the media id fills in,
// so the panel never starts empty. Every entry carries its API twin.
const displayLinks = computed<IExternalLinkDto[]>(() => {
  if (props.links?.length) {
    return props.links.map((link) => ({
      ...link,
      apiUrl: link.apiUrl ?? ensureApiUrl(link.url) ?? undefined,
    }))
  }

  const fallbackUrl = buildExternalUrl(props.mediaId, props.kind)
  const source = parseMediaId(props.mediaId)?.source
  if (!fallbackUrl || !source) return []
  return [{ source, url: fallbackUrl, apiUrl: ensureApiUrl(fallbackUrl) ?? undefined }]
})

interface IEditRow {
  source: string
  url: string
  apiUrl: string
}

const isEditing = ref(false)
const rows = ref<IEditRow[]>([])
const errorText = ref<string | null>(null)

// One row per source that already has a link, plus an empty row for each known
// source without one — that is how a missed shikimori match gets filled in.
function openEditor(): void {
  const drafts: IEditRow[] = displayLinks.value.map((link) => ({
    source: link.source,
    url: link.url,
    apiUrl: link.apiUrl ?? '',
  }))

  const present = new Set(drafts.map((row) => row.source.toLowerCase()))
  for (const source of MEDIA_SOURCES) {
    if (!present.has(source)) drafts.push({ source, url: '', apiUrl: '' })
  }

  rows.value = drafts
  errorText.value = null
  isEditing.value = true
}

// The API twin follows the page URL as it is typed: /api/ is added by itself
// whenever the address does not carry it yet.
function onUrlInput(row: IEditRow): void {
  row.apiUrl = ensureApiUrl(row.url.trim()) ?? ''
}

function onApiUrlBlur(row: IEditRow): void {
  const trimmed = row.apiUrl.trim()
  if (!trimmed) return
  row.apiUrl = ensureApiUrl(trimmed) ?? trimmed
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function save(): void {
  const next: IExternalLinkDto[] = []

  for (const row of rows.value) {
    const url = row.url.trim()
    if (!url) continue

    const apiUrl = ensureApiUrl((row.apiUrl.trim() || url))
    if (!isValidHttpUrl(url) || !apiUrl) {
      errorText.value = translate('detail.links.invalidUrl', { source: row.source })
      return
    }
    next.push({ source: row.source, url, apiUrl })
  }

  errorText.value = null
  isEditing.value = false
  emit('save', next)
}
</script>

<template>
  <div class="flex flex-col gap-1.5 text-sm">
    <div class="flex items-center justify-between gap-2">
      <span class="text-gray-500 dark:text-gray-400">{{ translate('detail.externalLinks') }}</span>
      <button
        type="button"
        class="rounded p-1 text-gray-400 transition-colors hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-300"
        data-testid="links-edit"
        :title="translate('detail.links.edit')"
        :aria-label="translate('detail.links.edit')"
        @click="openEditor"
      >
        <i class="pi pi-pencil" />
      </button>
    </div>

    <ul class="flex flex-col gap-1.5">
      <li
        v-for="link in displayLinks"
        :key="link.source"
        class="flex items-center gap-2"
      >
        <span class="min-w-0 flex-1 truncate capitalize text-gray-700 dark:text-gray-200">
          {{ link.source }}
        </span>
        <a
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs transition-colors hover:border-brand-400 dark:border-gray-700"
        >
          <i class="pi pi-external-link" />
          {{ translate('detail.links.page') }}
        </a>
        <a
          v-if="link.apiUrl"
          :href="link.apiUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs transition-colors hover:border-brand-400 dark:border-gray-700"
        >
          <i class="pi pi-code" />
          {{ translate('detail.links.api') }}
        </a>
      </li>
      <li
        v-if="displayLinks.length === 0"
        class="text-xs text-gray-400 dark:text-gray-500"
      >
        {{ translate('detail.links.empty') }}
      </li>
    </ul>

    <Dialog
      v-model:visible="isEditing"
      modal
      :header="translate('detail.links.editTitle')"
      :style="{ width: '32rem' }"
    >
      <div class="flex flex-col gap-4 text-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ translate('detail.links.apiHint') }}
        </p>

        <div
          v-for="row in rows"
          :key="row.source"
          class="flex flex-col gap-1.5"
        >
          <span class="font-medium capitalize text-gray-700 dark:text-gray-200">
            {{ row.source }}
          </span>
          <label class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ translate('detail.links.pageUrl') }}
            </span>
            <input
              v-model="row.url"
              type="url"
              class="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
              placeholder="https://…"
              @input="onUrlInput(row)"
            >
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ translate('detail.links.apiUrl') }}
            </span>
            <input
              v-model="row.apiUrl"
              type="url"
              class="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
              placeholder="https://…/api/…"
              @blur="onApiUrlBlur(row)"
            >
          </label>
        </div>

        <p
          v-if="errorText"
          class="text-xs text-red-600 dark:text-red-400"
        >
          {{ errorText }}
        </p>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-3 py-1.5 dark:border-gray-700"
            @click="isEditing = false"
          >
            {{ translate('actions.cancel') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            data-testid="links-save"
            :disabled="props.isBusy"
            @click="save"
          >
            {{ translate('actions.save') }}
          </button>
        </div>
      </div>
    </Dialog>
  </div>
</template>
