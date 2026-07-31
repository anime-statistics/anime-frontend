import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useVoiceStore = defineStore('voice', () => {
  const isRecording = ref(false)
  const isProcessing = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const errorMessage = ref<string | null>(null)

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

  return {
    isRecording,
    isProcessing,
    transcript,
    interimTranscript,
    errorMessage,
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
