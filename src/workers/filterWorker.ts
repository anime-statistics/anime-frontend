import { applyParsedFilters, type IFilterableItem, type IParsedFilters } from '@/core/utils/filterParser'

export interface IFilterWorkerRequest {
  items: IFilterableItem[]
  filters: IParsedFilters
}

addEventListener('message', (event: MessageEvent<IFilterWorkerRequest>) => {
  const { items, filters } = event.data
  postMessage(applyParsedFilters(items, filters))
})
