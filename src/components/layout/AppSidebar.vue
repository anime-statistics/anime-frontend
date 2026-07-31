<script setup lang="ts">
import { useSwipe } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import TagBadge from '@/components/common/TagBadge.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useTagStore } from '@/stores/useTagStore'

const SWIPE_CLOSE_PX = 60

const props = defineProps<{ isOpen: boolean, isCollapsed: boolean }>()
const emit = defineEmits<{ close: [], toggleCollapsed: [] }>()

const { translate } = useAppI18n()
const tagStore = useTagStore()

const drawer = ref<HTMLElement | null>(null)

// Either horizontal swipe dismisses the drawer: it slides in from the left, so
// swiping it back is natural, and there is nothing to the right to reveal.
useSwipe(drawer, {
  onSwipeEnd: (_event, direction) => {
    if (props.isOpen && (direction === 'left' || direction === 'right')) emit('close')
  },
  threshold: SWIPE_CLOSE_PX,
})

const NAV_ITEMS = [
  { name: 'home', icon: 'pi-home', labelKey: 'nav.home', hint: '' },
  { name: 'search', icon: 'pi-search', labelKey: 'nav.search', hint: ' (Ctrl+K)' },
  { name: 'tags', icon: 'pi-tags', labelKey: 'nav.tags', hint: ' (Ctrl+Shift+T)' },
  { name: 'settings', icon: 'pi-cog', labelKey: 'nav.settings', hint: '' },
] as const

onMounted(() => {
  if (tagStore.tags.length === 0) void tagStore.fetchTags()
})
</script>

<template>
  <div
    v-if="props.isOpen"
    class="fixed inset-0 z-30 bg-black/40 lg:hidden"
    @click="emit('close')"
  />

  <aside
    ref="drawer"
    class="fixed inset-y-0 left-0 z-40 flex w-64 touch-pan-y flex-col gap-2 overflow-y-auto border-r border-gray-200 bg-white p-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-transform lg:static lg:z-auto lg:w-auto lg:translate-x-0 dark:border-gray-800 dark:bg-gray-900"
    :class="props.isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center justify-between lg:justify-end">
      <button
        type="button"
        class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
        :aria-label="translate('layout.closeMenu')"
        @click="emit('close')"
      >
        <i class="pi pi-times" />
      </button>
      <button
        type="button"
        class="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block dark:text-gray-400 dark:hover:bg-gray-800"
        :aria-label="props.isCollapsed
          ? translate('layout.expandSidebar')
          : translate('layout.collapseSidebar')"
        @click="emit('toggleCollapsed')"
      >
        <i :class="props.isCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" />
      </button>
    </div>

    <nav
      class="flex flex-col gap-1"
      :aria-label="translate('nav.home')"
    >
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.name"
        :to="{ name: item.name }"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        active-class="bg-brand-50 text-brand-700 dark:bg-gray-800 dark:text-brand-300"
        :title="`${translate(item.labelKey)}${item.hint}`"
        @click="emit('close')"
      >
        <i :class="['pi', item.icon, 'shrink-0']" />
        <span :class="props.isCollapsed ? 'lg:hidden' : ''">{{ translate(item.labelKey) }}</span>
      </RouterLink>
    </nav>

    <section :class="['mt-4 min-h-0', props.isCollapsed ? 'lg:hidden' : '']">
      <h2
        class="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
      >
        {{ translate('layout.myTags') }}
      </h2>

      <p
        v-if="tagStore.tags.length === 0"
        class="px-3 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ translate('tags.empty') }}
      </p>

      <ul
        v-else
        class="flex flex-col gap-0.5"
      >
        <li
          v-for="tag in tagStore.tags"
          :key="tag.id"
          class="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RouterLink
            :to="{ name: 'home', query: { tag: tag.id } }"
            class="min-w-0 flex-1"
            :title="translate('tags.filterBy')"
            @click="emit('close')"
          >
            <TagBadge
              :tag="tag"
              size="sm"
              :dimmed="tag.isHidden"
            />
          </RouterLink>
          <button
            type="button"
            class="shrink-0 rounded p-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            :aria-label="tag.isHidden ? translate('layout.showTag') : translate('layout.hideTag')"
            @click="tagStore.toggleTagVisibility(tag.id)"
          >
            <i :class="['pi', tag.isHidden ? 'pi-eye-slash' : 'pi-eye']" />
          </button>
        </li>
      </ul>
    </section>
  </aside>
</template>
