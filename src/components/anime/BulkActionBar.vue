<script lang="ts">
export interface IBulkTagAction {
  add?: string[]
  remove?: string[]
  clear?: boolean
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useTagStore } from '@/stores/useTagStore'

type OpenMenu = 'add' | 'remove' | null

const props = defineProps<{ selectedCount: number, isBusy?: boolean }>()
const emit = defineEmits<{
  applyTags: [IBulkTagAction]
  clear: []
}>()

const { translate } = useAppI18n()
const tagStore = useTagStore()

const openMenu = ref<OpenMenu>(null)

function toggleMenu(menu: Exclude<OpenMenu, null>): void {
  openMenu.value = openMenu.value === menu ? null : menu
}

function applyTag(tagId: string): void {
  const action: IBulkTagAction
    = openMenu.value === 'remove' ? { remove: [tagId] } : { add: [tagId] }
  openMenu.value = null
  emit('applyTags', action)
}

// Dropping every tag is what taking a title out of the collection means.
function removeFromCollection(): void {
  openMenu.value = null
  emit('applyTags', { clear: true })
}
</script>

<template>
  <div
    v-if="props.selectedCount > 0"
    class="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-lg bg-brand-600 p-3 text-sm text-white shadow-xl"
  >
    <span class="font-medium">
      {{ translate('common.selected', { count: props.selectedCount }) }}
    </span>

    <div class="relative">
      <button
        type="button"
        class="rounded-lg bg-white/15 px-3 py-1.5 transition-colors hover:bg-white/25 disabled:opacity-50"
        :disabled="props.isBusy"
        @click="toggleMenu('add')"
      >
        {{ translate('bulk.addTag') }}
      </button>

      <ul
        v-if="openMenu === 'add'"
        class="absolute bottom-full left-0 mb-1 max-h-64 w-56 overflow-y-auto rounded-lg bg-white text-gray-800 shadow-xl dark:bg-gray-800 dark:text-gray-100"
      >
        <li
          v-for="tag in tagStore.tags"
          :key="tag.id"
        >
          <button
            type="button"
            class="flex w-full items-center px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="applyTag(tag.id)"
          >
            <TagBadge
              :tag="tag"
              size="sm"
            />
          </button>
        </li>
      </ul>
    </div>

    <div class="relative">
      <button
        type="button"
        class="rounded-lg bg-white/15 px-3 py-1.5 transition-colors hover:bg-white/25 disabled:opacity-50"
        :disabled="props.isBusy"
        @click="toggleMenu('remove')"
      >
        {{ translate('bulk.removeTag') }}
      </button>

      <ul
        v-if="openMenu === 'remove'"
        class="absolute bottom-full left-0 mb-1 max-h-64 w-56 overflow-y-auto rounded-lg bg-white text-gray-800 shadow-xl dark:bg-gray-800 dark:text-gray-100"
      >
        <li
          v-for="tag in tagStore.tags"
          :key="tag.id"
        >
          <button
            type="button"
            class="flex w-full items-center px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="applyTag(tag.id)"
          >
            <TagBadge
              :tag="tag"
              size="sm"
            />
          </button>
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="rounded-lg bg-white/15 px-3 py-1.5 transition-colors hover:bg-white/25 disabled:opacity-50"
      :disabled="props.isBusy"
      @click="removeFromCollection"
    >
      {{ translate('bulk.removeFromCollection') }}
    </button>

    <button
      type="button"
      class="ml-auto underline underline-offset-2"
      @click="emit('clear')"
    >
      {{ translate('common.clearSelection') }}
    </button>
  </div>
</template>
