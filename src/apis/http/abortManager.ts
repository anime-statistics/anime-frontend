const pendingRequests = new Map<string, AbortController>()

export function getAbortController(key: string): AbortController {
  pendingRequests.get(key)?.abort()
  const controller = new AbortController()
  pendingRequests.set(key, controller)
  return controller
}

export function removeAbortController(key: string): void {
  pendingRequests.delete(key)
}

export function abortAll(): void {
  pendingRequests.forEach((controller) => controller.abort())
  pendingRequests.clear()
}
