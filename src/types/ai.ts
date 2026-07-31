export type IChatRole = 'system' | 'user' | 'assistant'

export interface IChatMessage {
  id: string
  role: IChatRole
  content: string
  createdAt: string
  isStreaming?: boolean
}

export interface ILLmModel {
  id: string
  name: string
  providerId: string
  contextWindow: number
  supportsStreaming: boolean
}

export interface IAiParaphraseResult {
  original: string
  paraphrased: string
  modelId: string
}

export interface IAiRecommendation {
  mediaId: string
  title: string
  reason: string
  score: number
}
