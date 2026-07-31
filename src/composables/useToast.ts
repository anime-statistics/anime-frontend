import { readonly, ref, type Ref } from 'vue'

export type ToastSeverity = 'info' | 'success' | 'error'

export interface IToast {
  id: number
  message: string
  severity: ToastSeverity
}

const DEFAULT_DURATION = 3000

const toasts = ref<IToast[]>([])
let nextId = 0

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function show(message: string, severity: ToastSeverity = 'info', duration = DEFAULT_DURATION): number {
  const id = ++nextId
  toasts.value = [...toasts.value, { id, message, severity }]
  if (duration > 0) setTimeout(() => dismiss(id), duration)
  return id
}

export function useToast(): {
  toasts: Readonly<Ref<readonly IToast[]>>
  show: typeof show
  success: (message: string) => number
  error: (message: string) => number
  dismiss: typeof dismiss
  clear: () => void
} {
  return {
    toasts: readonly(toasts),
    show,
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
    dismiss,
    clear: () => {
      toasts.value = []
    },
  }
}
