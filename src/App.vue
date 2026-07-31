<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import MobileNav from '@/components/layout/MobileNav.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { DETAIL_ROUTE_NAMES } from '@/router'

const route = useRoute()
const { translate } = useAppI18n()

const detailRoutes = new Set<string>(DETAIL_ROUTE_NAMES)
const isMobileMenuOpen = ref(false)
const isSidebarCollapsed = ref(false)

const hasDetailPanel = computed(() => detailRoutes.has(String(route.name)))

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
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-white"
    >
      {{ translate('layout.skipToContent') }}
    </a>

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
      >
        <RouterView v-slot="{ Component }">
          <Transition
            name="page-fade"
            mode="out-in"
          >
            <component :is="Component" />
          </Transition>
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
    <ToastContainer />
  </div>
</template>
