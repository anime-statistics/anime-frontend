import { apiClient } from '@/apis/http/client'
import { isObject } from '@/core/utils/caseConverter'

export const AI = '/ai' as const

export interface IProcessVoiceResult {
  processedText: string
  suggestions: string[]
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
