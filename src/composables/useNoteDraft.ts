import { onUnmounted, watch, type Ref } from 'vue'

export const DRAFT_KEY_PREFIX = 'anime-statistics:note-draft:'

export function draftKey(mediaId: string, noteId: string | null): string {
  return `${DRAFT_KEY_PREFIX}${mediaId}:${noteId ?? 'new'}`
}

function warnBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault()
  event.returnValue = ''
}

// Several editors can be mounted at once, so the shared listener is reference
// counted rather than attached and detached per component.
let dirtyEditors = 0

function setGuard(active: boolean): void {
  const next = Math.max(0, dirtyEditors + (active ? 1 : -1))

  if (dirtyEditors === 0 && next > 0) {
    window.addEventListener('beforeunload', warnBeforeUnload)
  } else if (dirtyEditors > 0 && next === 0) {
    window.removeEventListener('beforeunload', warnBeforeUnload)
  }

  dirtyEditors = next
}

export function useNoteDraft(
  key: Ref<string>,
  isDirty: Ref<boolean>,
): {
  read: () => string | null
  write: (content: string) => void
  discard: () => void
} {
  let isGuarding = false

  function read(): string | null {
    return localStorage.getItem(key.value)
  }

  function write(content: string): void {
    if (content) localStorage.setItem(key.value, content)
    else localStorage.removeItem(key.value)
  }

  function discard(): void {
    localStorage.removeItem(key.value)
  }

  watch(
    isDirty,
    (dirty) => {
      if (dirty === isGuarding) return
      isGuarding = dirty
      setGuard(dirty)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (isGuarding) {
      isGuarding = false
      setGuard(false)
    }
  })

  return { read, write, discard }
}
