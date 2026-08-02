import { apiClient } from '@/apis/http/client'
import { isObject } from '@/core/utils/caseConverter'
import type { IAiRecommendation, IChatRole, ILLmModel } from '@/types/ai'

export const AI = '/ai' as const
export const AI_TIMEOUT_MS = 180_000

export interface IProcessVoiceResult {
  processedText: string
  suggestions: string[]
}

export interface IApiTokenUsage {
  inputTokens: number
  outputTokens: number
}

export interface IParaphraseResult {
  result: string
  usage: IApiTokenUsage
}

export interface IRecommendationsResult {
  items: IAiRecommendation[]
  usage: IApiTokenUsage
}

export interface IChatResult {
  reply: string
  usage: IApiTokenUsage
}

export interface IAiRequestOptions {
  model: string
  temperature: number
  deepThink: boolean
  context?: IAiContext
}

export interface IAiContext {
  watchedTitles: string[]
  tags: string[]
}

export interface IChatApiMessage {
  role: IChatRole
  content: string
}

function readUsage(value: unknown): IApiTokenUsage {
  if (isObject(value)) {
    const input = Number(value.inputTokens)
    const output = Number(value.outputTokens)
    if (Number.isFinite(input) && Number.isFinite(output)) {
      return { inputTokens: input, outputTokens: output }
    }
  }
  return { inputTokens: 0, outputTokens: 0 }
}

export async function processVoice(
  text: string,
  signal?: AbortSignal,
): Promise<IProcessVoiceResult> {
  const { data } = await apiClient.post<unknown>(`${AI}/process-voice`, { text }, { signal })
  if (!isObject(data) || typeof data.processedText !== 'string') {
    throw new Error('Unexpected process-voice response')
  }

  return {
    processedText: data.processedText,
    suggestions: Array.isArray(data.suggestions)
      ? data.suggestions.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

export async function paraphrase(
  text: string,
  style: string,
  options: IAiRequestOptions,
): Promise<IParaphraseResult> {
  const { data } = await apiClient.post<unknown>(
    `${AI}/paraphrase`,
    { text, style, ...options },
    { timeout: AI_TIMEOUT_MS },
  )
  if (!isObject(data) || typeof data.result !== 'string') {
    throw new Error('Unexpected paraphrase response')
  }

  return { result: data.result, usage: readUsage(data.usage) }
}

function isRecommendation(value: unknown): value is IAiRecommendation {
  return (
    isObject(value)
    && typeof value.mediaId === 'string'
    && typeof value.title === 'string'
    && typeof value.reason === 'string'
    && typeof value.score === 'number'
  )
}

export async function getRecommendations(
  prompt: string,
  mood: string,
  options: IAiRequestOptions,
): Promise<IRecommendationsResult> {
  const { data } = await apiClient.post<unknown>(
    `${AI}/recommendations`,
    { prompt, mood, ...options },
    { timeout: AI_TIMEOUT_MS },
  )
  if (!isObject(data) || !Array.isArray(data.items)) {
    throw new Error('Unexpected recommendations response')
  }

  return { items: data.items.filter(isRecommendation), usage: readUsage(data.usage) }
}

export async function chatResponse(
  messages: IChatApiMessage[],
  options: IAiRequestOptions,
): Promise<IChatResult> {
  const { data } = await apiClient.post<unknown>(
    `${AI}/chat`,
    { messages, ...options },
    { timeout: AI_TIMEOUT_MS },
  )
  if (!isObject(data) || typeof data.reply !== 'string') {
    throw new Error('Unexpected chat response')
  }

  return { reply: data.reply, usage: readUsage(data.usage) }
}

function isLlmModel(value: unknown): value is ILLmModel {
  return (
    isObject(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.inputPrice === 'number'
    && typeof value.outputPrice === 'number'
  )
}

export async function getModels(signal?: AbortSignal): Promise<ILLmModel[]> {
  const { data } = await apiClient.get<unknown>(`${AI}/models`, { signal })
  if (!isObject(data) || !Array.isArray(data.items)) {
    throw new Error('Unexpected models response')
  }
  return data.items.filter(isLlmModel)
}
