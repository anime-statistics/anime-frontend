import { getCurrentScope, onScopeDispose, readonly, ref, type Ref } from 'vue'

const DEFAULT_DEBOUNCE_MS = 50

export function useMediaQuery(query: string, debounceMs = DEFAULT_DEBOUNCE_MS): Ref<boolean> {
  const matches = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return readonly(matches) as Ref<boolean>
  }

  const mediaQueryList = window.matchMedia(query)
  matches.value = mediaQueryList.matches

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  function handleChange(event: MediaQueryListEvent): void {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      matches.value = event.matches
    }, debounceMs)
  }

  mediaQueryList.addEventListener('change', handleChange)

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      mediaQueryList.removeEventListener('change', handleChange)
    })
  }

  return matches
}

export function useIsMobile(): Ref<boolean> {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet(): Ref<boolean> {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsDesktop(): Ref<boolean> {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsLandscape(): Ref<boolean> {
  return useMediaQuery('(orientation: landscape)')
}

export function useIsPortrait(): Ref<boolean> {
  return useMediaQuery('(orientation: portrait)')
}
