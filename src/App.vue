<script setup lang="ts">
import { useMagicKeys } from '@vueuse/core'
import { useHead } from '@vueuse/head'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import MobileNav from '@/components/layout/MobileNav.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import OfflineBanner from '@/components/common/OfflineBanner.vue'
import ShortcutOverlay from '@/components/common/ShortcutOverlay.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { DETAIL_ROUTE_NAMES } from '@/router'

const route = useRoute()
const router = useRouter()
const { translate } = useAppI18n()

// The assistant drags in markdown-it, DOMPurify and diff; keeping it out of the
// entry chunk saves every visitor who never opens the panel.
const AiAssistant = defineAsyncComponent(() => import('@/components/ai/AiAssistant.vue'))

const detailRoutes = new Set<string>(DETAIL_ROUTE_NAMES)
const isMobileMenuOpen = ref(false)
const isSidebarCollapsed = ref(false)
const isShortcutOverlayOpen = ref(false)

// Reserving the third column for a named view that no route actually provides
// left an empty bordered strip on every detail page.
const hasDetailPanel = computed(() =>
  detailRoutes.has(String(route.name))
  && route.matched.some((record) => record.components?.detail !== undefined),
)

const ROUTE_TITLE_KEYS = {
  home: 'pages.homeTitle',
  search: 'pages.searchTitle',
  tags: 'pages.tagsTitle',
  settings: 'pages.settingsTitle',
} as const

const pageTitle = computed(() => {
  const key = ROUTE_TITLE_KEYS[String(route.name) as keyof typeof ROUTE_TITLE_KEYS]
  const appTitle = translate('app.title')
  return key ? `${translate(key)} · ${appTitle}` : appTitle
})

useHead({
  title: pageTitle,
  meta: [{ name: 'description', content: () => translate('footer.rights') }],
})

const gridColumns = computed(() => {
  if (isSidebarCollapsed.value) {
    return hasDetailPanel.value
      ? 'lg:grid-cols-[64px_1fr] xl:grid-cols-[64px_1fr_320px]'
      : 'lg:grid-cols-[64px_1fr]'
  }
  return hasDetailPanel.value
    ? 'lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_320px]'
    : 'lg:grid-cols-[260px_1fr]'
})

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
})

const keys = useMagicKeys({
  // `?` and Ctrl+K would otherwise reach the browser's own find and search bars.
  passive: false,
  onEventFired: (event) => {
    const isShortcut
      = (event.ctrlKey && event.key.toLowerCase() === 'k')
        || (event.key === '?' && !isTypingTarget(event.target))
    if (event.type === 'keydown' && isShortcut) event.preventDefault()
  },
})

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

watch(keys['Ctrl+K'], (pressed) => {
  if (pressed) void router.push({ name: 'search' })
})

watch(keys['Ctrl+Shift+T'], (pressed) => {
  if (pressed) void router.push({ name: 'tags' })
})

watch(keys['Ctrl+Shift+N'], (pressed) => {
  if (!pressed) return
  if (detailRoutes.has(String(route.name))) {
    void router.push({ query: { ...route.query, newNote: 'true' } })
  }
})

watch(keys['?'], (pressed) => {
  if (pressed) isShortcutOverlayOpen.value = true
})

watch(keys.Escape, (pressed) => {
  if (pressed) isShortcutOverlayOpen.value = false
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-white"
    >
      {{ translate('layout.skipToContent') }}
    </a>

    <OfflineBanner />

    <AppHeader @toggle-menu="isMobileMenuOpen = !isMobileMenuOpen" />

    <div
      class="grid flex-1 grid-cols-1"
      :class="gridColumns"
    >
      <AppSidebar
        :is-open="isMobileMenuOpen"
        :is-collapsed="isSidebarCollapsed"
        @close="isMobileMenuOpen = false"
        @toggle-collapsed="isSidebarCollapsed = !isSidebarCollapsed"
      />

      <main
        id="main-content"
        class="min-w-0 p-4 pb-20 md:pb-4"
        role="main"
      >
        <RouterView v-slot="{ Component }">
          <!-- The boundary sits outside the transition: its own root is a
               fragment, which <Transition> cannot swap. -->
          <ErrorBoundary :key="String(route.name)">
            <Transition
              name="page-fade"
              mode="out-in"
            >
              <component :is="Component" />
            </Transition>
          </ErrorBoundary>
        </RouterView>
      </main>

      <aside
        v-if="hasDetailPanel"
        class="hidden border-l border-gray-200 p-4 xl:block dark:border-gray-800"
        :aria-label="translate('layout.detailPanel')"
      >
        <RouterView name="detail" />
      </aside>
    </div>

    <AppFooter />
    <MobileNav />
    <AiAssistant />
    <ToastContainer />
    <ShortcutOverlay
      :open="isShortcutOverlayOpen"
      @close="isShortcutOverlayOpen = false"
    />
  </div>
</template>
