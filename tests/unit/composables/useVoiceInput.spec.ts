import { createPinia, setActivePinia } from 'pinia'
import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getSpeechRecognitionConstructor,
  localeToVoiceLanguage,
  useVoiceInput,
} from '@/composables/useVoiceInput'
import { useVoiceStore } from '@/stores/useVoiceStore'

class FakeRecognition {
  static instances: FakeRecognition[] = []

  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: ((event: ISpeechRecognitionEvent) => void) | null = null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null = null
  onend: (() => void) | null = null
  onstart: (() => void) | null = null

  start = vi.fn()
  stop = vi.fn(() => this.onend?.())
  abort = vi.fn()

  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn(() => true)

  constructor() {
    FakeRecognition.instances.push(this)
  }

  emitResult(chunks: { text: string, isFinal: boolean }[]): void {
    const results = chunks.map((chunk) => ({
      isFinal: chunk.isFinal,
      length: 1,
      item: () => ({ transcript: chunk.text, confidence: 1 }),
      0: { transcript: chunk.text, confidence: 1 },
    }))

    this.onresult?.({
      resultIndex: 0,
      results: { ...results, length: results.length, item: (i: number) => results[i] },
    } as unknown as ISpeechRecognitionEvent)
  }
}

function installSpeechRecognition(): void {
  vi.stubGlobal('SpeechRecognition', FakeRecognition)
  window.SpeechRecognition = FakeRecognition as unknown as SpeechRecognitionConstructor
}

beforeEach(() => {
  setActivePinia(createPinia())
  FakeRecognition.instances = []
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete window.SpeechRecognition
  delete window.webkitSpeechRecognition
})

describe('localeToVoiceLanguage', () => {
  it('maps app locales to BCP-47 recognition languages', () => {
    expect(localeToVoiceLanguage('ru')).toBe('ru-RU')
    expect(localeToVoiceLanguage('en')).toBe('en-US')
  })
})

describe('getSpeechRecognitionConstructor', () => {
  it('returns null when the browser has no implementation', () => {
    expect(getSpeechRecognitionConstructor()).toBeNull()
  })

  it('prefers the standard constructor over the webkit one', () => {
    installSpeechRecognition()

    expect(getSpeechRecognitionConstructor()).toBe(FakeRecognition)
  })
})

describe('useVoiceInput without support', () => {
  it('reports unsupported and never records', () => {
    const voice = useVoiceInput()

    voice.start()

    expect(voice.isSupported.value).toBe(false)
    expect(voice.isRecording.value).toBe(false)
  })
})

describe('useVoiceInput with support', () => {
  it('configures the recogniser from the options', () => {
    installSpeechRecognition()
    const voice = useVoiceInput({ lang: 'en-US', continuous: false })

    voice.start()

    const [instance] = FakeRecognition.instances
    expect(instance.lang).toBe('en-US')
    expect(instance.continuous).toBe(false)
    expect(instance.interimResults).toBe(true)
    expect(instance.start).toHaveBeenCalled()
    expect(voice.isRecording.value).toBe(true)
  })

  it('defaults the language to the app locale', () => {
    installSpeechRecognition()
    useVoiceInput().start()

    expect(FakeRecognition.instances[0].lang).toBe('ru-RU')
  })

  it('keeps interim results separate from the final transcript', () => {
    installSpeechRecognition()
    const voice = useVoiceInput()
    voice.start()

    FakeRecognition.instances[0].emitResult([{ text: 'наруто ', isFinal: false }])

    expect(voice.interimTranscript.value).toBe('наруто ')
    expect(voice.transcript.value).toBe('')
  })

  it('accumulates final chunks and clears the interim text', () => {
    installSpeechRecognition()
    const voice = useVoiceInput()
    voice.start()

    FakeRecognition.instances[0].emitResult([{ text: 'наруто', isFinal: true }])
    FakeRecognition.instances[0].emitResult([{ text: 'шиппуден', isFinal: true }])

    expect(voice.transcript.value).toBe('наруто шиппуден')
    expect(voice.interimTranscript.value).toBe('')
  })

  it('calls onFinal for each finalised chunk only', () => {
    installSpeechRecognition()
    const onFinal = vi.fn()
    const voice = useVoiceInput({ onFinal })
    voice.start()

    FakeRecognition.instances[0].emitResult([
      { text: 'первое', isFinal: true },
      { text: 'второе', isFinal: false },
    ])

    expect(onFinal).toHaveBeenCalledExactlyOnceWith('первое')
  })

  it('mirrors the transcript into the voice store', () => {
    installSpeechRecognition()
    const store = useVoiceStore()
    const voice = useVoiceInput()
    voice.start()

    expect(store.isRecording).toBe(true)
    FakeRecognition.instances[0].emitResult([{ text: 'наруто', isFinal: true }])

    expect(store.transcript).toBe('наруто')
  })

  it('stops recording and records the reason on error', () => {
    installSpeechRecognition()
    const voice = useVoiceInput()
    voice.start()

    FakeRecognition.instances[0].onerror?.({
      error: 'not-allowed',
      message: '',
    } as ISpeechRecognitionErrorEvent)

    expect(voice.errorMessage.value).toBe('not-allowed')
    expect(voice.isRecording.value).toBe(false)
  })

  it('toggles between start and stop', () => {
    installSpeechRecognition()
    const voice = useVoiceInput()

    voice.toggle()
    expect(voice.isRecording.value).toBe(true)

    voice.toggle()
    expect(voice.isRecording.value).toBe(false)
  })

  it('ignores a second start while already recording', () => {
    installSpeechRecognition()
    const voice = useVoiceInput()

    voice.start()
    voice.start()

    expect(FakeRecognition.instances).toHaveLength(1)
  })

  it('aborts the session when the scope is disposed', () => {
    installSpeechRecognition()
    const scope = effectScope()
    scope.run(() => {
      const voice = useVoiceInput()
      voice.start()
    })

    scope.stop()

    expect(FakeRecognition.instances[0].abort).toHaveBeenCalled()
  })
})
