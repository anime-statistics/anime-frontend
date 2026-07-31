export type IViewMode = 'cards' | 'table' | 'list' | 'kanban'

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
  notifyAnimeIds: string[]
  aiModelId: string
  aiDeepThink: boolean
  aiTemperature: number
  aiShareContext: boolean
  promptTemplates: Record<string, string>
  llmProviders: ILlmProviderConfig[]
  activeLlmProviderId?: string
}
