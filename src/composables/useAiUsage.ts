import { computed, readonly, ref, type ComputedRef, type Ref } from 'vue'
import type { ILLmModel, ITokenUsage } from '@/types/ai'

// Session-scoped by design: the backend keeps the durable history, the UI only
// shows what this page load has spent.
const entries = ref<ITokenUsage[]>([])

export function computeCost(
  model: ILLmModel | undefined,
  inputTokens: number,
  outputTokens: number,
): number {
  if (!model) return 0
  return inputTokens * model.inputPrice + outputTokens * model.outputPrice
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

export function useAiUsage(): {
  entries: Readonly<Ref<readonly ITokenUsage[]>>
  totalTokens: ComputedRef<number>
  totalCost: ComputedRef<number>
  record: (model: ILLmModel | undefined, modelId: string, inputTokens: number, outputTokens: number) => void
  reset: () => void
} {
  const totalTokens = computed(() =>
    entries.value.reduce((sum, entry) => sum + entry.inputTokens + entry.outputTokens, 0),
  )
  const totalCost = computed(() =>
    entries.value.reduce((sum, entry) => sum + entry.cost, 0),
  )

  function record(
    model: ILLmModel | undefined,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): void {
    entries.value = [
      ...entries.value,
      {
        model: model?.id ?? modelId,
        inputTokens,
        outputTokens,
        cost: computeCost(model, inputTokens, outputTokens),
        timestamp: new Date().toISOString(),
      },
    ]
  }

  function reset(): void {
    entries.value = []
  }

  return { entries: readonly(entries) as Readonly<Ref<readonly ITokenUsage[]>>, totalTokens, totalCost, record, reset }
}
