import { computed, getCurrentScope, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useVoiceStore } from '@/stores/useVoiceStore'

export type VoiceLanguage = 'ru-RU' | 'en-US'

export interface IVoiceInputOptions {
  lang?: VoiceLanguage
  continuous?: boolean
  onFinal?: (transcript: string) => void
}

export function localeToVoiceLanguage(locale: string): VoiceLanguage {
  return locale === 'en' ? 'en-US' : 'ru-RU'
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function useVoiceInput(options: IVoiceInputOptions = {}): {
  isSupported: ComputedRef<boolean>
  isRecording: Ref<boolean>
  transcript: Ref<string>
  interimTranscript: Ref<string>
  errorMessage: Ref<string | null>
  language: Ref<VoiceLanguage>
  start: () => void
  stop: () => void
  toggle: () => void
  reset: () => void
} {
  const settingsStore = useSettingsStore()
  const voiceStore = useVoiceStore()

  const isRecording = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const errorMessage = ref<string | null>(null)
  const language = ref<VoiceLanguage>(
    options.lang ?? localeToVoiceLanguage(settingsStore.locale),
  )

  const Recognition = getSpeechRecognitionConstructor()
  const isSupported = computed(() => Recognition !== null)

  let recognition: ISpeechRecognition | null = null

  function handleResult(event: ISpeechRecognitionEvent): void {
    let finalChunk = ''
    let interimChunk = ''

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index]
      if (result.isFinal) finalChunk += result[0].transcript
      else interimChunk += result[0].transcript
    }

    interimTranscript.value = interimChunk
    voiceStore.setInterimTranscript(interimChunk)

    if (finalChunk.trim()) {
      transcript.value = [transcript.value, finalChunk.trim()].filter(Boolean).join(' ')
      voiceStore.appendTranscript(finalChunk)
      options.onFinal?.(finalChunk.trim())
    }
  }

  function createRecognition(): ISpeechRecognition | null {
    if (!Recognition) return null

    const instance = new Recognition()
    instance.lang = language.value
    instance.continuous = options.continuous ?? true
    instance.interimResults = true
    // The Web Speech API is conventionally driven through its on* properties;
    // a fresh instance is created per session, so handlers are never stacked.
    // oxlint-disable prefer-add-event-listener
    instance.onresult = handleResult
    instance.onerror = (event) => {
      errorMessage.value = event.error
      isRecording.value = false
      voiceStore.setError(event.error)
    }
    instance.onend = () => {
      isRecording.value = false
      voiceStore.stopRecording()
    }
    // oxlint-enable prefer-add-event-listener

    return instance
  }

  function start(): void {
    if (!isSupported.value || isRecording.value) return

    recognition = createRecognition()
    if (!recognition) return

    errorMessage.value = null
    interimTranscript.value = ''
    isRecording.value = true
    voiceStore.startRecording()

    try {
      recognition.start()
    } catch {
      // start() throws if a recognition session is already running in this tab.
      isRecording.value = false
      voiceStore.stopRecording()
    }
  }

  function stop(): void {
    recognition?.stop()
    recognition = null
    isRecording.value = false
    interimTranscript.value = ''
    voiceStore.stopRecording()
  }

  function toggle(): void {
    if (isRecording.value) stop()
    else start()
  }

  function reset(): void {
    transcript.value = ''
    interimTranscript.value = ''
    errorMessage.value = null
    voiceStore.clearTranscript()
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      recognition?.abort()
      recognition = null
    })
  }

  return {
    isSupported,
    isRecording,
    transcript,
    interimTranscript,
    errorMessage,
    language,
    start,
    stop,
    toggle,
    reset,
  }
}
