<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { computed, ref, watch } from 'vue'
import { CreateTagDto, type ICreateTagDto, type ITagDto } from '@/apis/dtos/tagDto'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAppI18n } from '@/composables/useAppI18n'

const props = defineProps<{ visible: boolean, tag: ITagDto | null, nextSortOrder: number }>()
const emit = defineEmits<{
  'update:visible': [boolean]
  'submit': [ICreateTagDto]
}>()

const { translate } = useAppI18n()

const PRESET_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#0ea5e9',
  '#14b8a6',
  '#64748b',
] as const

const ICON_OPTIONS = [
  '',
  'pi-heart',
  'pi-star',
  'pi-replay',
  'pi-calendar',
  'pi-users',
  'pi-volume-up',
  'pi-clock',
  'pi-book',
  'pi-bookmark',
].map((value) => ({ value, label: value || '—' }))

const name = ref('')
const color = ref<string>(PRESET_COLORS[3])
const icon = ref('')
const isHidden = ref(false)
const errorKey = ref<'tags.nameRequired' | 'tags.colorInvalid' | null>(null)

const preview = computed<ITagDto>(() => ({
  id: props.tag?.id ?? 'preview',
  name: name.value.trim() || translate('tags.placeholder'),
  color: color.value,
  icon: icon.value || undefined,
  isHidden: isHidden.value,
  sortOrder: props.tag?.sortOrder ?? props.nextSortOrder,
}))

watch(
  () => [props.visible, props.tag] as const,
  ([visible, tag]) => {
    if (!visible) return
    name.value = tag?.name ?? ''
    color.value = tag?.color ?? PRESET_COLORS[3]
    icon.value = tag?.icon ?? ''
    isHidden.value = tag?.isHidden ?? false
    errorKey.value = null
  },
)

function submit(): void {
  const candidate = {
    name: name.value.trim(),
    color: color.value,
    icon: icon.value || undefined,
    isHidden: isHidden.value,
    sortOrder: props.tag?.sortOrder ?? props.nextSortOrder,
  }

  const parsed = CreateTagDto.safeParse(candidate)
  if (!parsed.success) {
    errorKey.value = parsed.error.issues.some((issue) => issue.path[0] === 'color')
      ? 'tags.colorInvalid'
      : 'tags.nameRequired'
    return
  }

  emit('submit', parsed.data)
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    modal
    :header="props.tag ? translate('tags.edit') : translate('tags.create')"
    :style="{ width: '26rem' }"
    @update:visible="emit('update:visible', $event)"
  >
    <form
      class="flex flex-col gap-4"
      @submit.prevent="submit"
    >
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-gray-600 dark:text-gray-300">{{ translate('tags.name') }}</span>
        <input
          v-model="name"
          type="text"
          maxlength="50"
          class="rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-gray-700"
          :placeholder="translate('tags.placeholder')"
        >
      </label>

      <fieldset class="flex flex-col gap-2 text-sm">
        <legend class="pb-1 text-gray-600 dark:text-gray-300">
          {{ translate('tags.color') }}
        </legend>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="preset in PRESET_COLORS"
            :key="preset"
            type="button"
            class="size-7 rounded-full border-2 transition-transform hover:scale-110"
            :class="color === preset ? 'border-gray-900 dark:border-white' : 'border-transparent'"
            :style="{ backgroundColor: preset }"
            :aria-label="preset"
            :aria-pressed="color === preset"
            @click="color = preset"
          />
          <input
            v-model="color"
            type="color"
            class="size-7 cursor-pointer rounded border border-gray-200 bg-transparent dark:border-gray-700"
            :aria-label="translate('tags.color')"
          >
        </div>
      </fieldset>

      <div class="flex flex-col gap-1 text-sm">
        <label
          class="text-gray-600 dark:text-gray-300"
          for="tag-icon"
        >
          {{ translate('tags.icon') }}
        </label>
        <!-- A native <option> cannot host an icon font glyph, so the list has to
             be a rendered one for the choice to mean anything. -->
        <Select
          v-model="icon"
          input-id="tag-icon"
          :options="ICON_OPTIONS"
          option-label="label"
          option-value="value"
          class="w-full"
        >
          <template #value="{ value }">
            <span class="flex items-center gap-2">
              <i
                v-if="value"
                :class="['pi', value]"
              />
              <span>{{ value || '—' }}</span>
            </span>
          </template>

          <template #option="{ option }">
            <span class="flex items-center gap-2">
              <i
                v-if="option.value"
                :class="['pi', option.value]"
              />
              <span
                v-else
                class="inline-block w-4"
                aria-hidden="true"
              />
              <span>{{ option.label }}</span>
            </span>
          </template>
        </Select>
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input
          v-model="isHidden"
          type="checkbox"
          class="accent-brand-600"
        >
        <span class="text-gray-600 dark:text-gray-300">{{ translate('tags.hideFromSidebar') }}</span>
      </label>

      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500 dark:text-gray-400">{{ translate('tags.title') }}:</span>
        <TagBadge :tag="preview" />
      </div>

      <p
        v-if="errorKey"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ translate(errorKey) }}
      </p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700"
          @click="emit('update:visible', false)"
        >
          {{ translate('actions.cancel') }}
        </button>
        <button
          type="submit"
          class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700"
        >
          {{ translate('actions.save') }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
