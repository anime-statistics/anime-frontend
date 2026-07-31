<script setup lang="ts">
import MultiSelect from 'primevue/multiselect'
import { ref } from 'vue'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useTagStore } from '@/stores/useTagStore'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const { translate } = useAppI18n()
const tagStore = useTagStore()

const filterText = ref('')
const isCreating = ref(false)

function onFilter(event: { value: string }): void {
  filterText.value = event.value
}

async function createFromFilter(): Promise<void> {
  const name = filterText.value.trim()
  if (!name || isCreating.value) return

  isCreating.value = true
  const created = await tagStore.createTag({
    name: name.slice(0, 50),
    color: '#6366f1',
    isHidden: false,
    sortOrder: tagStore.tags.length,
  })
  isCreating.value = false

  if (created) {
    emit('update:modelValue', [...props.modelValue, created.id])
    filterText.value = ''
  }
}
</script>

<template>
  <MultiSelect
    :model-value="props.modelValue"
    :options="tagStore.tags"
    option-label="name"
    option-value="id"
    filter
    display="chip"
    class="w-full"
    data-testid="add-tag-btn"
    :placeholder="translate('tags.select')"
    :aria-label="translate('tags.select')"
    :pt="{ pcFilterContainer: { root: { 'data-testid': 'tag-input-wrap' } } }"
    @filter="onFilter"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #option="{ option }">
      <TagBadge
        :tag="option"
        size="sm"
      />
    </template>

    <template #footer>
      <button
        v-if="filterText.trim() && !tagStore.tags.some((tag) => tag.name === filterText.trim())"
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-600 hover:bg-gray-100 disabled:opacity-50 dark:text-brand-300 dark:hover:bg-gray-700"
        :disabled="isCreating"
        @click="createFromFilter"
      >
        <i class="pi pi-plus" />
        {{ translate('tags.createInline', { name: filterText.trim() }) }}
      </button>
    </template>
  </MultiSelect>
</template>
