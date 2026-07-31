import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from '@/App.vue'
import { config } from '@/core/constants/config'
import { i18n } from '@/core/i18n'
import 'primeicons/primeicons.css'
import '@/assets/styles/main.css'

const app = createApp(App)

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

async function initApp(): Promise<void> {
  if (config.mockEnabled) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  app.mount('#app')
}

void initApp()
