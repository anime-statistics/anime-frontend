import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue'

export function useOnlineStatus(): { isOnline: Ref<boolean> } {
  const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

  if (typeof window === 'undefined') return { isOnline }

  function goOnline(): void {
    isOnline.value = true
  }

  function goOffline(): void {
    isOnline.value = false
  }

  window.addEventListener('online', goOnline)
  window.addEventListener('offline', goOffline)

  if (getCurrentScope()) {
    onScopeDispose(() => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    })
  }

  return { isOnline }
}
