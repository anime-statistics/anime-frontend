export type IViewMode = 'cards' | 'table' | 'list' | 'kanban'

export type IThemeMode = 'light' | 'dark' | 'system'

export type IAppLocale = 'ru' | 'en'

export type IUiDensity = 'compact' | 'standard' | 'relaxed'

export type IVoiceModel = 'browser' | 'whisper-1'

export type ISyncInterval = 'never' | '15m' | '30m' | '1h' | '6h'

export type IPaginationMode = 'pagination' | 'infinite'

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
  aiMaxTokens: number
  aiVoiceModel: IVoiceModel
  uiPrimaryColor: string
  uiDensity: IUiDensity
  uiFontSize: number
  syncInterval: ISyncInterval
  paginationMode: IPaginationMode
  autoCommitShikimori: boolean
  autoCommitAniliberty: boolean
  promptTemplates: Record<string, string>
  llmProviders: ILlmProviderConfig[]
  activeLlmProviderId?: string
}
