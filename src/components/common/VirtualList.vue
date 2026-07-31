<script setup lang="ts" generic="T">
import { computed, ref } from 'vue'
import { useVirtualList, VIRTUAL_ROW_HEIGHT } from '@/composables/useVirtualList'

const props = withDefaults(
  defineProps<{ items: T[], rowHeight?: number, maxHeight?: number }>(),
  { rowHeight: VIRTUAL_ROW_HEIGHT, maxHeight: 480 },
)

defineSlots<{ default: (props: { item: T, index: number }) => unknown }>()

const scroller = ref<HTMLElement | null>(null)
const count = computed(() => props.items.length)
const { virtualRows, totalHeight } = useVirtualList(count, scroller, props.rowHeight)
</script>

<template>
  <div
    ref="scroller"
    class="overflow-y-auto"
    :style="{ maxHeight: `${props.maxHeight}px` }"
  >
    <div
      class="relative w-full"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        v-for="row in virtualRows"
        :key="row.key as number"
        class="absolute inset-x-0"
        :style="{ height: `${row.size}px`, transform: `translateY(${row.start}px)` }"
      >
        <slot
          :item="props.items[row.index]"
          :index="row.index"
        />
      </div>
    </div>
  </div>
</template>
