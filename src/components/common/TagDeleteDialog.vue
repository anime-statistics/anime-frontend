<script lang="ts">
// Deleting a tag has to say what happens to the titles wearing it: they either
// keep their place in the collection minus this tag, or leave the collection.
export type TagDeleteMode = 'untag' | 'removeFromCollection'
</script>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { computed } from 'vue'
import type { ITagDto } from '@/apis/dtos/tagDto'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { isSeededTag } from '@/core/constants/seededTags'

const props = defineProps<{ visible: boolean, tag: ITagDto | null, itemCount: number }>()
const emit = defineEmits<{
  'update:visible': [boolean]
  'confirm': [TagDeleteMode]
}>()

const { translate, translatePlural } = useAppI18n()

// The seeded six are ordinary tags, but they are what the whole watch-status
// vocabulary is built on, so removing one deserves a word of warning.
const isSeeded = computed(() => Boolean(props.tag && isSeededTag(props.tag.id)))

function confirm(mode: TagDeleteMode): void {
  emit('confirm', mode)
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    modal
    :header="translate('tags.delete')"
    :style="{ width: '28rem' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div
      v-if="props.tag"
      class="flex flex-col gap-4 text-sm"
    >
      <p class="flex flex-wrap items-center gap-2 text-gray-700 dark:text-gray-200">
        <TagBadge
          :tag="props.tag"
          size="sm"
        />
        <span>{{ translatePlural('tags.itemCount', props.itemCount) }}</span>
      </p>

      <p
        v-if="isSeeded"
        class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
      >
        <i class="pi pi-exclamation-triangle mt-0.5 shrink-0" />
        <span>{{ translate('tags.deleteSeededWarning') }}</span>
      </p>

      <p
        v-if="props.itemCount === 0"
        class="text-gray-500 dark:text-gray-400"
      >
        {{ translate('tags.confirmDelete', { name: props.tag.name }) }}
      </p>
      <p
        v-else
        class="text-gray-500 dark:text-gray-400"
      >
        {{ translate('tags.deleteQuestion') }}
      </p>

      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-3 py-2 text-left transition-colors hover:border-brand-400 dark:border-gray-700"
          @click="confirm('untag')"
        >
          <span class="font-medium">{{ translate('tags.deleteKeepItems') }}</span>
          <span class="block text-xs text-gray-500 dark:text-gray-400">
            {{ translate('tags.deleteKeepItemsHint') }}
          </span>
        </button>

        <button
          v-if="props.itemCount > 0"
          type="button"
          class="rounded-lg border border-red-200 px-3 py-2 text-left text-red-700 transition-colors hover:border-red-400 dark:border-red-900 dark:text-red-300"
          @click="confirm('removeFromCollection')"
        >
          <span class="font-medium">{{ translate('tags.deleteWithItems') }}</span>
          <span class="block text-xs text-red-500 dark:text-red-400">
            {{ translate('tags.deleteWithItemsHint') }}
          </span>
        </button>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-3 py-1.5 dark:border-gray-700"
          @click="emit('update:visible', false)"
        >
          {{ translate('actions.cancel') }}
        </button>
      </div>
    </div>
  </Dialog>
</template>
