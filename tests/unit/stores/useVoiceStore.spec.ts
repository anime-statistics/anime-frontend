import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useVoiceStore } from '@/stores/useVoiceStore'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useVoiceStore recording lifecycle', () => {
  it('starts idle', () => {
    const store = useVoiceStore()

    expect(store.isRecording).toBe(false)
    expect(store.isBusy).toBe(false)
    expect(store.transcript).toBe('')
  })

  it('marks the store busy while recording', () => {
    const store = useVoiceStore()

    store.startRecording()

    expect(store.isRecording).toBe(true)
    expect(store.isBusy).toBe(true)
  })

  it('clears the interim transcript on stop', () => {
    const store = useVoiceStore()
    store.startRecording()
    store.setInterimTranscript('нару')

    store.stopRecording()

    expect(store.isRecording).toBe(false)
    expect(store.interimTranscript).toBe('')
  })
})

describe('useVoiceStore transcript', () => {
  it('joins interim text onto the confirmed transcript', () => {
    const store = useVoiceStore()
    store.appendTranscript('наруто')
    store.setInterimTranscript('шиппуден')

    expect(store.fullTranscript).toBe('наруто шиппуден')
  })

  it('appends successive fragments and drops the interim text', () => {
    const store = useVoiceStore()

    store.appendTranscript('  наруто ')
    store.setInterimTranscript('что-то')
    store.appendTranscript('шиппуден')

    expect(store.transcript).toBe('наруто шиппуден')
    expect(store.interimTranscript).toBe('')
  })

  it('clears everything', () => {
    const store = useVoiceStore()
    store.appendTranscript('наруто')
    store.setInterimTranscript('шип')

    store.clearTranscript()

    expect(store.fullTranscript).toBe('')
  })
})

describe('useVoiceStore error handling', () => {
  it('stops recording and processing when an error arrives', () => {
    const store = useVoiceStore()
    store.startRecording()
    store.setProcessing(true)

    store.setError('Микрофон недоступен')

    expect(store.errorMessage).toBe('Микрофон недоступен')
    expect(store.isRecording).toBe(false)
    expect(store.isProcessing).toBe(false)
  })

  it('clears the previous error on a new recording', () => {
    const store = useVoiceStore()
    store.setError('Микрофон недоступен')

    store.startRecording()

    expect(store.errorMessage).toBeNull()
  })
})
