const LIGHT_MS = 10
const MEDIUM_MS = 20
const SUCCESS_MS = 30
const ERROR_PATTERN = [50, 100, 50]

function isSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

function vibrate(pattern: number | number[]): void {
  if (!isSupported()) return
  navigator.vibrate(pattern)
}

export function useHaptic(): {
  isSupported: boolean
  lightTap: () => void
  mediumTap: () => void
  success: () => void
  error: () => void
} {
  return {
    isSupported: isSupported(),
    lightTap: () => vibrate(LIGHT_MS),
    mediumTap: () => vibrate(MEDIUM_MS),
    success: () => vibrate(SUCCESS_MS),
    error: () => vibrate(ERROR_PATTERN),
  }
}
