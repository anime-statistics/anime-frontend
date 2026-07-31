// The Web Speech API is not part of lib.dom.d.ts, so the pieces this app uses
// are declared here rather than pulling in another @types package.
interface ISpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface ISpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item: (index: number) => ISpeechRecognitionAlternative
  readonly [index: number]: ISpeechRecognitionAlternative
}

interface ISpeechRecognitionResultList {
  readonly length: number
  item: (index: number) => ISpeechRecognitionResult
  readonly [index: number]: ISpeechRecognitionResult
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: ISpeechRecognitionResultList
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}
