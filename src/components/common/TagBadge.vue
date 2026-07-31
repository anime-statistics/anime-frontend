<script setup lang="ts">
import { computed } from 'vue'
import type { ITagDto } from '@/apis/dtos/tagDto'
import { readableTextColor } from '@/core/utils/colorPalette'

const props = withDefaults(
  defineProps<{ tag: ITagDto, size?: 'sm' | 'md', dimmed?: boolean }>(),
  { size: 'md', dimmed: false },
)

const textColor = computed(() => readableTextColor(props.tag.color))

const sizeClass = computed(() =>
  props.size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
)
</script>

<template>
  <span
    class="inline-flex max-w-full items-center gap-1 rounded-full font-medium"
    :class="[sizeClass, props.dimmed ? 'opacity-50' : '']"
    :style="{ backgroundColor: props.tag.color, color: textColor }"
  >
    <i
      v-if="props.tag.icon"
      :class="['pi', props.tag.icon, 'text-[0.85em]']"
    />
    <span class="truncate">{{ props.tag.name }}</span>
  </span>
</template>
