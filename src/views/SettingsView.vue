<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { getModels } from '@/apis/aiApi'
import { apiClient } from '@/apis/http/client'
import ColumnSlider from '@/components/common/ColumnSlider.vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useSyncHistory } from '@/composables/useSyncHistory'
import { useToast } from '@/composables/useToast'
import { config } from '@/core/constants/config'
import type { AppMessageKey } from '@/core/i18n/types'
import { isObject } from '@/core/utils/caseConverter'
import { readSecret, saveSecret } from '@/core/utils/secureStorage'
import { normaliseSettings, useSettingsStore } from '@/stores/useSettingsStore'
import { useSyncStore } from '@/stores/useSyncStore'
import type { IAppLocale, ISyncInterval, IThemeMode, IUiDensity, IViewMode, IVoiceModel } from '@/types/settings'

type SettingsSection = 'general' | 'appearance' | 'ai' | 'integrations' | 'sync' | 'storage' | 'about'

const { translate, translatePlural, locale } = useAppI18n()
const settingsStore = useSettingsStore()
const syncStore = useSyncStore()
const syncHistory = useSyncHistory()
const queryClient = useQueryClient()
const toast = useToast()

const SECTIONS: { value: SettingsSection, labelKey: AppMessageKey, icon: string }[] = [
  { value: 'general', labelKey: 'settings.sectionGeneral', icon: 'pi-sliders-h' },
  { value: 'appearance', labelKey: 'settings.sectionAppearance', icon: 'pi-palette' },
  { value: 'ai', labelKey: 'settings.sectionAi', icon: 'pi-sparkles' },
  { value: 'integrations', labelKey: 'settings.sectionIntegrations', icon: 'pi-link' },
  { value: 'sync', labelKey: 'settings.sectionSync', icon: 'pi-sync' },
  { value: 'storage', labelKey: 'settings.sectionStorage', icon: 'pi-database' },
  { value: 'about', labelKey: 'settings.sectionAbout', icon: 'pi-info-circle' },
]

const activeSection = ref<SettingsSection>('general')
const isDev = import.meta.env.DEV
const appVersion = __APP_VERSION__

const modelsQuery = useQuery({
  queryKey: ['ai', 'models'],
  queryFn: ({ signal }) => getModels(signal),
})

const localeModel = computed({
  get: () => settingsStore.locale,
  set: (value: IAppLocale) => {
    settingsStore.setLocale(value)
    locale.value = value
  },
})

const viewModeModel = computed({
  get: () => settingsStore.viewMode,
  set: (value: IViewMode) => settingsStore.setViewMode(value),
})

const columnsModel = computed({
  get: () => settingsStore.columns,
  set: (value: number) => settingsStore.setColumns(value),
})

const themeModel = computed({
  get: () => settingsStore.settings.theme,
  set: (value: IThemeMode) => settingsStore.setTheme(value),
})

const MOCK_OVERRIDE_KEY = 'anime-statistics:mock-override'

// Mirrors the effective state main.ts computed at startup.
const mocksEnabled = computed(() => {
  const override = localStorage.getItem(MOCK_OVERRIDE_KEY)
  return isDev && override !== null ? override === 'on' : config.mockEnabled
})

function toggleMocks(event: Event): void {
  const enabled = (event.target as HTMLInputElement).checked
  localStorage.setItem(MOCK_OVERRIDE_KEY, enabled ? 'on' : 'off')
  window.location.reload()
}

function resetAll(): void {
  if (!window.confirm(translate('settings.resetConfirm'))) return
  settingsStore.reset()
  settingsStore.persist()
}

const apiKey = ref(readSecret('llm-api-key'))
const shikimoriClientId = ref(readSecret('shikimori-client-id'))
const shikimoriClientSecret = ref(readSecret('shikimori-client-secret'))
const shikimoriRedirectUri = ref(readSecret('shikimori-redirect-uri'))
const anilibertyToken = ref(readSecret('aniliberty-token'))

const connectionStatus = ref<Record<'shikimori' | 'aniliberty', boolean | null>>({
  shikimori: null,
  aniliberty: null,
})

function persistSecrets(): void {
  saveSecret('llm-api-key', apiKey.value)
  saveSecret('shikimori-client-id', shikimoriClientId.value)
  saveSecret('shikimori-client-secret', shikimoriClientSecret.value)
  saveSecret('shikimori-redirect-uri', shikimoriRedirectUri.value)
  saveSecret('aniliberty-token', anilibertyToken.value)
}

async function checkConnection(service: 'shikimori' | 'aniliberty'): Promise<void> {
  persistSecrets()
  const payload = service === 'shikimori'
    ? {
        clientId: shikimoriClientId.value,
        clientSecret: shikimoriClientSecret.value,
        redirectUri: shikimoriRedirectUri.value,
      }
    : { token: anilibertyToken.value }

  try {
    const { data } = await apiClient.post<unknown>(`/integrations/${service}/check`, payload)
    connectionStatus.value = {
      ...connectionStatus.value,
      [service]: isObject(data) && data.connected === true,
    }
  } catch {
    connectionStatus.value = { ...connectionStatus.value, [service]: false }
  }
}

async function syncNow(): Promise<void> {
  try {
    const { data } = await apiClient.get<unknown>('/sync/pending')
    const changes = isObject(data) && typeof data.total === 'number' ? data.total : 0
    syncHistory.record('ok', changes)
    syncStore.lastSyncAt = new Date().toISOString()
  } catch {
    syncHistory.record('error', 0)
  }
}

const storageUsedKb = computed(() => {
  let bytes = 0
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) ?? ''
    bytes += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2
  }
  return Math.round((bytes / 1024) * 10) / 10
})

function clearQueryCache(): void {
  queryClient.clear()
  toast.success(translate('settings.cacheCleared'))
}

function exportSettings(): void {
  const blob = new Blob([JSON.stringify(settingsStore.settings, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'anime-statistics-settings.json'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const importInput = ref<HTMLInputElement | null>(null)

async function importSettings(event: Event): Promise<void> {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return

  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    const parsed: unknown = JSON.parse(await file.text())
    if (!isObject(parsed)) throw new Error('not an object')
    settingsStore.settings = normaliseSettings(parsed)
    settingsStore.persist()
    locale.value = settingsStore.locale
    toast.success(translate('settings.importDone'))
  } catch {
    toast.error(translate('settings.importFailed'))
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })
}

const CHANGELOG = [
  'AI-ассистент: парафраз, рекомендации, чат со стримингом',
  'Голосовой ввод в поиске и редакторе заметок',
  'Markdown-редактор с предпросмотром и вложениями',
  'Система тегов с drag-and-drop и фильтрацией',
  'Канбан-доска и массовые операции',
]
</script>

<template>
  <section class="flex flex-col gap-4">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {{ translate('pages.settingsTitle') }}
    </h1>

    <div class="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav
        class="flex gap-1 overflow-x-auto lg:flex-col"
        :aria-label="translate('pages.settingsTitle')"
      >
        <button
          v-for="section in SECTIONS"
          :key="section.value"
          type="button"
          class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
          :class="activeSection === section.value
            ? 'bg-brand-50 text-brand-700 dark:bg-gray-800 dark:text-brand-300'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'"
          :aria-current="activeSection === section.value ? 'true' : undefined"
          @click="activeSection = section.value"
        >
          <i :class="['pi', section.icon, 'text-xs']" />
          {{ translate(section.labelKey) }}
        </button>
      </nav>

      <div class="flex max-w-2xl flex-col gap-5">
        <template v-if="activeSection === 'general'">
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.language') }}</span>
            <select
              v-model="localeModel"
              class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.defaultViewMode') }}</span>
            <select
              v-model="viewModeModel"
              class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
            >
              <option value="cards">{{ translate('viewMode.cards') }}</option>
              <option value="list">{{ translate('viewMode.list') }}</option>
              <option value="table">{{ translate('viewMode.table') }}</option>
              <option value="kanban">{{ translate('viewMode.kanban') }}</option>
            </select>
          </label>

          <div class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.defaultColumns') }}</span>
            <ColumnSlider v-model="columnsModel" />
          </div>

          <label
            v-if="isDev"
            class="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              class="accent-brand-600"
              :checked="mocksEnabled"
              @change="toggleMocks"
            >
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.mocksEnabled') }}</span>
            <span class="text-xs text-gray-400">({{ translate('settings.mocksRestartHint') }})</span>
          </label>

          <button
            type="button"
            class="self-start rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            @click="resetAll"
          >
            {{ translate('settings.resetAll') }}
          </button>
        </template>

        <template v-else-if="activeSection === 'appearance'">
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.theme') }}</span>
            <select
              v-model="themeModel"
              class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
            >
              <option value="light">{{ translate('app.themeLight') }}</option>
              <option value="dark">{{ translate('app.themeDark') }}</option>
              <option value="system">{{ translate('app.themeSystem') }}</option>
            </select>
          </label>

          <label class="flex items-center gap-3 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.primaryColor') }}</span>
            <input
              type="color"
              class="size-8 cursor-pointer rounded border border-gray-200 bg-transparent dark:border-gray-700"
              :value="settingsStore.settings.uiPrimaryColor"
              @input="settingsStore.update({ uiPrimaryColor: ($event.target as HTMLInputElement).value })"
            >
            <span class="font-mono text-xs text-gray-500">{{ settingsStore.settings.uiPrimaryColor }}</span>
          </label>

          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.density') }}</span>
            <select
              :value="settingsStore.settings.uiDensity"
              class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
              @change="settingsStore.update({ uiDensity: ($event.target as HTMLSelectElement).value as IUiDensity })"
            >
              <option value="compact">{{ translate('settings.densityCompact') }}</option>
              <option value="standard">{{ translate('settings.densityStandard') }}</option>
              <option value="relaxed">{{ translate('settings.densityRelaxed') }}</option>
            </select>
          </label>

          <label class="flex items-center gap-3 text-sm">
            <span class="shrink-0 text-gray-600 dark:text-gray-300">{{ translate('settings.fontSize') }}</span>
            <input
              type="range"
              min="12"
              max="20"
              step="1"
              class="flex-1 accent-brand-600"
              :value="settingsStore.settings.uiFontSize"
              @input="settingsStore.update({ uiFontSize: Number(($event.target as HTMLInputElement).value) })"
            >
            <span class="w-12 text-right tabular-nums">{{ settingsStore.settings.uiFontSize }}px</span>
          </label>
        </template>

        <template v-else-if="activeSection === 'ai'">
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.aiProvider') }}</span>
            <select
              :value="settingsStore.settings.aiModelId"
              class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
              @change="settingsStore.update({ aiModelId: ($event.target as HTMLSelectElement).value })"
            >
              <option
                v-for="model in modelsQuery.data.value ?? []"
                :key="model.id"
                :value="model.id"
              >
                {{ model.name }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.aiApiKey') }}</span>
            <input
              v-model="apiKey"
              type="password"
              autocomplete="off"
              class="rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-gray-700"
              @change="persistSecrets"
            >
            <span class="text-xs text-gray-400">{{ translate('settings.aiApiKeyHint') }}</span>
          </label>

          <label class="flex items-center gap-3 text-sm">
            <span class="shrink-0 text-gray-600 dark:text-gray-300">{{ translate('ai.temperature') }}</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              class="flex-1 accent-brand-600"
              :value="settingsStore.settings.aiTemperature"
              @input="settingsStore.update({ aiTemperature: Number(($event.target as HTMLInputElement).value) })"
            >
            <span class="w-8 text-right tabular-nums">{{ settingsStore.settings.aiTemperature.toFixed(1) }}</span>
          </label>

          <label class="flex items-center gap-3 text-sm">
            <span class="shrink-0 text-gray-600 dark:text-gray-300">{{ translate('settings.aiMaxTokens') }}</span>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              class="flex-1 accent-brand-600"
              :value="settingsStore.settings.aiMaxTokens"
              @input="settingsStore.update({ aiMaxTokens: Number(($event.target as HTMLInputElement).value) })"
            >
            <span class="w-14 text-right tabular-nums">{{ settingsStore.settings.aiMaxTokens }}</span>
          </label>

          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="accent-brand-600"
              :checked="settingsStore.settings.aiShareContext"
              @change="settingsStore.update({ aiShareContext: ($event.target as HTMLInputElement).checked })"
            >
            <span class="text-gray-600 dark:text-gray-300">{{ translate('ai.shareContext') }}</span>
          </label>

          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.aiVoiceModel') }}</span>
            <select
              :value="settingsStore.settings.aiVoiceModel"
              class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
              @change="settingsStore.update({ aiVoiceModel: ($event.target as HTMLSelectElement).value as IVoiceModel })"
            >
              <option value="browser">{{ translate('settings.voiceModelBrowser') }}</option>
              <option value="whisper-1">Whisper</option>
            </select>
          </label>
        </template>

        <template v-else-if="activeSection === 'integrations'">
          <fieldset class="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <legend class="flex items-center gap-2 px-1 text-sm font-semibold">
              {{ translate('settings.shikimoriTitle') }}
              <span
                v-if="connectionStatus.shikimori !== null"
                class="size-2 rounded-full"
                :class="connectionStatus.shikimori ? 'bg-emerald-500' : 'bg-red-500'"
                :title="connectionStatus.shikimori
                  ? translate('settings.connected')
                  : translate('settings.disconnected')"
              />
            </legend>
            <label class="flex flex-col gap-1 text-sm">
              <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.clientId') }}</span>
              <input
                v-model="shikimoriClientId"
                type="text"
                autocomplete="off"
                class="rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 dark:border-gray-700"
              >
            </label>
            <label class="flex flex-col gap-1 text-sm">
              <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.clientSecret') }}</span>
              <input
                v-model="shikimoriClientSecret"
                type="password"
                autocomplete="off"
                class="rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 dark:border-gray-700"
              >
            </label>
            <label class="flex flex-col gap-1 text-sm">
              <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.redirectUri') }}</span>
              <input
                v-model="shikimoriRedirectUri"
                type="text"
                autocomplete="off"
                class="rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 dark:border-gray-700"
              >
            </label>
            <button
              type="button"
              class="self-start rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700"
              @click="checkConnection('shikimori')"
            >
              {{ translate('settings.checkConnection') }}
            </button>
          </fieldset>

          <fieldset class="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <legend class="flex items-center gap-2 px-1 text-sm font-semibold">
              {{ translate('settings.anilibertyTitle') }}
              <span
                v-if="connectionStatus.aniliberty !== null"
                class="size-2 rounded-full"
                :class="connectionStatus.aniliberty ? 'bg-emerald-500' : 'bg-red-500'"
                :title="connectionStatus.aniliberty
                  ? translate('settings.connected')
                  : translate('settings.disconnected')"
              />
            </legend>
            <label class="flex flex-col gap-1 text-sm">
              <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.apiToken') }}</span>
              <input
                v-model="anilibertyToken"
                type="password"
                autocomplete="off"
                class="rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 dark:border-gray-700"
              >
            </label>
            <button
              type="button"
              class="self-start rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700"
              @click="checkConnection('aniliberty')"
            >
              {{ translate('settings.checkConnection') }}
            </button>
          </fieldset>
        </template>

        <template v-else-if="activeSection === 'sync'">
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.syncInterval') }}</span>
            <select
              :value="settingsStore.settings.syncInterval"
              class="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 dark:border-gray-700"
              @change="settingsStore.update({ syncInterval: ($event.target as HTMLSelectElement).value as ISyncInterval })"
            >
              <option value="never">{{ translate('settings.intervalNever') }}</option>
              <option value="15m">{{ translate('settings.interval15m') }}</option>
              <option value="30m">{{ translate('settings.interval30m') }}</option>
              <option value="1h">{{ translate('settings.interval1h') }}</option>
              <option value="6h">{{ translate('settings.interval6h') }}</option>
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="accent-brand-600"
              :checked="settingsStore.settings.autoCommitShikimori"
              @change="settingsStore.update({ autoCommitShikimori: ($event.target as HTMLInputElement).checked })"
            >
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.autoCommitShikimori') }}</span>
          </label>

          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="accent-brand-600"
              :checked="settingsStore.settings.autoCommitAniliberty"
              @change="settingsStore.update({ autoCommitAniliberty: ($event.target as HTMLInputElement).checked })"
            >
            <span class="text-gray-600 dark:text-gray-300">{{ translate('settings.autoCommitAniliberty') }}</span>
          </label>

          <button
            type="button"
            class="self-start rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-brand-700"
            @click="syncNow"
          >
            <i class="pi pi-sync mr-1 text-xs" />
            {{ translate('settings.syncNow') }}
          </button>

          <section class="flex flex-col gap-2">
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {{ translate('settings.syncHistory') }}
            </h2>
            <p
              v-if="syncHistory.entries.value.length === 0"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ translate('settings.syncHistoryEmpty') }}
            </p>
            <table
              v-else
              class="w-full text-left text-sm"
            >
              <tbody>
                <tr
                  v-for="entry in syncHistory.entries.value"
                  :key="entry.at"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <td class="py-1.5 text-gray-700 dark:text-gray-200">
                    {{ formatDate(entry.at) }}
                  </td>
                  <td class="py-1.5">
                    <span
                      class="size-2 rounded-full"
                      :class="entry.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'"
                      style="display: inline-block"
                    />
                  </td>
                  <td class="py-1.5 text-gray-500 dark:text-gray-400">
                    {{ translatePlural('settings.syncChanges', entry.changes) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </template>

        <template v-else-if="activeSection === 'storage'">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ translate('settings.storageUsed', { size: storageUsedKb }) }}
          </p>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-brand-400 dark:border-gray-700"
              @click="clearQueryCache"
            >
              {{ translate('settings.clearQueryCache') }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-brand-400 dark:border-gray-700"
              @click="exportSettings"
            >
              {{ translate('settings.exportSettings') }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-brand-400 dark:border-gray-700"
              @click="importInput?.click()"
            >
              {{ translate('settings.importSettings') }}
            </button>
            <input
              ref="importInput"
              type="file"
              accept="application/json"
              class="hidden"
              @change="importSettings"
            >
          </div>
        </template>

        <template v-else>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ translate('settings.aboutVersion', { version: appVersion }) }}
          </p>

          <section class="flex flex-col gap-1 text-sm">
            <h2 class="font-semibold text-gray-700 dark:text-gray-200">
              {{ translate('settings.aboutLinks') }}
            </h2>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand-600 hover:underline dark:text-brand-300"
            >GitHub</a>
            <a
              href="https://shikimori.one"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand-600 hover:underline dark:text-brand-300"
            >Shikimori</a>
            <a
              href="https://aniliberty.top"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand-600 hover:underline dark:text-brand-300"
            >AniLiberty</a>
          </section>

          <section class="flex flex-col gap-1 text-sm">
            <h2 class="font-semibold text-gray-700 dark:text-gray-200">
              {{ translate('settings.aboutChangelog') }}
            </h2>
            <ul class="list-disc pl-5 text-gray-600 dark:text-gray-300">
              <li
                v-for="entry in CHANGELOG"
                :key="entry"
              >
                {{ entry }}
              </li>
            </ul>
          </section>
        </template>
      </div>
    </div>
  </section>
</template>
