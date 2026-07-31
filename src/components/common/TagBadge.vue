<script setup lang="ts">
import { computed } from 'vue'
import type { ITagDto } from '@/apis/dtos/tagDto'

const props = withDefaults(
  defineProps<{ tag: ITagDto, size?: 'sm' | 'md', dimmed?: boolean }>(),
  { size: 'md', dimmed: false },
)

// Relative luminance decides whether dark or light text stays readable on the tag colour.
const textColor = computed(() => {
  const hex = props.tag.color.replace('#', '')
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const [r, g, b] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  )
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.45 ? '#111827' : '#ffffff'
})

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
