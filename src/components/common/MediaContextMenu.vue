<script lang="ts">
export interface IContextMenuTarget {
  mediaId: string
  source: string
  x: number
  y: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useToast } from '@/composables/useToast'
import { buildExternalUrl, buildInternalUrl, type MediaKind } from '@/core/utils/externalLinks'

const props = withDefaults(
  defineProps<{ target: IContextMenuTarget | null, kind?: MediaKind }>(),
  { kind: 'anime' },
)
const emit = defineEmits<{ close: [], editTags: [string] }>()

const { translate } = useAppI18n()
const toast = useToast()

const externalUrl = computed(() =>
  props.target ? buildExternalUrl(props.target.mediaId, props.kind) : null,
)

const externalLabel = computed(() =>
  props.target?.source === 'aniliberty'
    ? translate('contextMenu.openAniliberty')
    : translate('contextMenu.openShikimori'),
)

async function copyLink(): Promise<void> {
  if (!props.target) return

  const url = new URL(buildInternalUrl(props.target.mediaId, props.kind), window.location.origin)
  try {
    await navigator.clipboard.writeText(url.toString())
    toast.success(translate('contextMenu.linkCopied'))
  } catch {
    toast.error(translate('contextMenu.copyFailed'))
  }
  emit('close')
}
</script>

<template>
  <div
    v-if="props.target"
    class="fixed inset-0 z-40"
    @click="emit('close')"
    @contextmenu.prevent="emit('close')"
  >
    <ul
      class="absolute min-w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800"
      :style="{ left: `${props.target.x}px`, top: `${props.target.y}px` }"
      @click.stop
    >
      <li>
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="emit('editTags', props.target.mediaId)"
        >
          <i class="pi pi-tags" />
          {{ translate('contextMenu.editTags') }}
        </button>
      </li>
      <li v-if="externalUrl">
        <a
          :href="externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="emit('close')"
        >
          <i class="pi pi-external-link" />
          {{ externalLabel }}
        </a>
      </li>
      <li>
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="copyLink"
        >
          <i class="pi pi-copy" />
          {{ translate('contextMenu.copyLink') }}
        </button>
      </li>
    </ul>
  </div>
</template>
