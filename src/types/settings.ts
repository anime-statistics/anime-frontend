export type IViewMode = 'cards' | 'table' | 'list'

export type IThemeMode = 'light' | 'dark' | 'system'

export type IAppLocale = 'ru' | 'en'

export interface ILlmProviderConfig {
  id: string
  name: string
  baseUrl: string
  model: string
  apiKey?: string
  isEnabled: boolean
}

export interface IAppSettings {
  locale: IAppLocale
  theme: IThemeMode
  viewMode: IViewMode
  columnsCount: number
  pageSize: number
  isVoiceInputEnabled: boolean
  isAiEnabled: boolean
  llmProviders: ILlmProviderConfig[]
  activeLlmProviderId?: string
}
