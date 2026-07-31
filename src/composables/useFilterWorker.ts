import { getCurrentScope, onScopeDispose } from 'vue'
import {
  applyParsedFilters,
  type IFilterableItem,
  type IParsedFilters,
} from '@/core/utils/filterParser'

export const FILTER_WORKER_THRESHOLD = 10_000

export function useFilterWorker() {
  let worker: Worker | null = null

  function getWorker(): Worker {
    // The URL must stay a literal relative path — Vite resolves workers statically
    // and does not apply the @/ alias here.
    worker ??= new Worker(new URL('../workers/filterWorker.ts', import.meta.url), {
      type: 'module',
    })
    return worker
  }

  function terminate(): void {
    worker?.terminate()
    worker = null
  }

  function filterInWorker<T extends IFilterableItem>(
    items: T[],
    filters: IParsedFilters,
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const instance = getWorker()

      function cleanup(): void {
        instance.removeEventListener('message', onMessage)
        instance.removeEventListener('error', onError)
      }

      function onMessage(event: MessageEvent<T[]>): void {
        cleanup()
        resolve(event.data)
      }

      function onError(event: ErrorEvent): void {
        cleanup()
        reject(new Error(event.message))
      }

      instance.addEventListener('message', onMessage)
      instance.addEventListener('error', onError)
      // Worker.postMessage takes no targetOrigin — the lint rule targets window.postMessage.
      // oxlint-disable-next-line require-post-message-target-origin
      instance.postMessage({ items, filters })
    })
  }

  async function filterItems<T extends IFilterableItem>(
    items: T[],
    filters: IParsedFilters,
  ): Promise<T[]> {
    if (items.length <= FILTER_WORKER_THRESHOLD) return applyParsedFilters(items, filters)
    return filterInWorker(items, filters)
  }

  if (getCurrentScope()) onScopeDispose(terminate)

  return { filterInWorker, filterItems, terminate }
}
