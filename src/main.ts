import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from '@/App.vue'
import { config } from '@/core/constants/config'
import { i18n } from '@/core/i18n'
import { useSettingsStore } from '@/stores/useSettingsStore'
import 'primeicons/primeicons.css'
import '@/assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities',
      },
    },
  },
})

app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  },
})

async function initApp(): Promise<void> {
  if (config.mockEnabled) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  const settingsStore = useSettingsStore(pinia)
  settingsStore.initFromLocalStorage()
  i18n.global.locale.value = settingsStore.locale
  settingsStore.$subscribe(() => {
    settingsStore.persist()
  })

  app.mount('#app')
}

void initApp()
