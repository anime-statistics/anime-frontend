import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export const DETAIL_ROUTE_NAMES = ['anime-detail', 'manga-detail'] as const

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  {
    path: '/anime/:id',
    name: 'anime-detail',
    component: () => import('@/views/AnimeDetailView.vue'),
    props: true,
  },
  {
    path: '/manga/:id',
    name: 'manga-detail',
    component: () => import('@/views/MangaDetailView.vue'),
    props: true,
  },
  { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
  { path: '/tags', name: 'tags', component: () => import('@/views/TagsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach(() => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})
