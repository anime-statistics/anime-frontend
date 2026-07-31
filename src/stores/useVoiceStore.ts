import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { processVoice, type IProcessVoiceResult } from '@/apis/aiApi'
import { toApiRequestError } from '@/apis/http/errorHandler'

export const useVoiceStore = defineStore('voice', () => {
  const isRecording = ref(false)
  const isProcessing = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const errorMessage = ref<string | null>(null)
  const suggestions = ref<string[]>([])

  const isBusy = computed(() => isRecording.value || isProcessing.value)
  const fullTranscript = computed(() =>
    [transcript.value, interimTranscript.value].filter(Boolean).join(' '),
  )

  function startRecording(): void {
    isRecording.value = true
    errorMessage.value = null
    interimTranscript.value = ''
  }

  function stopRecording(): void {
    isRecording.value = false
    interimTranscript.value = ''
  }

  function setInterimTranscript(value: string): void {
    interimTranscript.value = value
  }

  function appendTranscript(value: string): void {
    transcript.value = [transcript.value, value.trim()].filter(Boolean).join(' ')
    interimTranscript.value = ''
  }

  function clearTranscript(): void {
    transcript.value = ''
    interimTranscript.value = ''
  }

  function setProcessing(value: boolean): void {
    isProcessing.value = value
  }

  function setError(message: string | null): void {
    errorMessage.value = message
    isRecording.value = false
    isProcessing.value = false
  }

  // Runs the raw transcript through the AI clean-up endpoint; on failure the
  // caller still gets the original text back so dictation is never lost.
  async function processTranscript(text: string): Promise<IProcessVoiceResult> {
    const trimmed = text.trim()
    if (!trimmed) return { processedText: '', suggestions: [] }

    isProcessing.value = true
    errorMessage.value = null

    try {
      const result = await processVoice(trimmed)
      suggestions.value = result.suggestions
      return result
    } catch (error) {
      errorMessage.value = toApiRequestError(error).message
      return { processedText: trimmed, suggestions: [] }
    } finally {
      isProcessing.value = false
    }
  }

  return {
    isRecording,
    isProcessing,
    transcript,
    interimTranscript,
    errorMessage,
    suggestions,
    processTranscript,
    isBusy,
    fullTranscript,
    startRecording,
    stopRecording,
    setInterimTranscript,
    appendTranscript,
    clearTranscript,
    setProcessing,
    setError,
  }
})
