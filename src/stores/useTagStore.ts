import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient } from '@/apis/http/client'
import { toApiRequestError } from '@/apis/http/errorHandler'
import type { ICreateTagDto, ITagDto, IUpdateTagDto } from '@/apis/dtos/tagDto'
import { validateTagDto, validateTagDtoArray } from '@/apis/validators/tagValidators'
import { TAGS } from '@/core/constants/apiRoutes'
import { isObject } from '@/core/utils/caseConverter'

export const useTagStore = defineStore('tag', () => {
  const tags = ref<ITagDto[]>([])
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  const visibleTags = computed(() => tags.value.filter((tag) => !tag.isHidden))
  const hiddenTagIds = computed(() =>
    tags.value.filter((tag) => tag.isHidden).map((tag) => tag.id),
  )
  const tagsById = computed(() => new Map(tags.value.map((tag) => [tag.id, tag])))
  const tagNamesById = computed(
    () => new Map(tags.value.map((tag) => [tag.id, tag.name.toLowerCase()])),
  )

  function findTag(id: string): ITagDto | undefined {
    return tagsById.value.get(id)
  }

  function resolveTags(ids: readonly string[] | undefined): ITagDto[] {
    return (ids ?? [])
      .map((id) => tagsById.value.get(id))
      .filter((tag): tag is ITagDto => tag !== undefined)
  }

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    isLoading.value = true
    errorMessage.value = null
    try {
      return await action()
    } catch (error) {
      errorMessage.value = toApiRequestError(error).message
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTags(): Promise<void> {
    await run(async () => {
      const { data } = await apiClient.get<unknown>(TAGS)
      if (!isObject(data)) throw new Error('Unexpected tags response')
      tags.value = validateTagDtoArray(data.items)
    })
  }

  async function createTag(payload: ICreateTagDto): Promise<ITagDto | null> {
    return run(async () => {
      const { data } = await apiClient.post<unknown>(TAGS, payload)
      const created = validateTagDto(data)
      tags.value = [...tags.value, created]
      return created
    })
  }

  async function updateTag(id: string, payload: IUpdateTagDto): Promise<ITagDto | null> {
    return run(async () => {
      const { data } = await apiClient.patch<unknown>(`${TAGS}/${id}`, payload)
      const updated = validateTagDto(data)
      tags.value = tags.value.map((tag) => (tag.id === id ? updated : tag))
      return updated
    })
  }

  async function deleteTag(id: string): Promise<void> {
    await run(async () => {
      await apiClient.delete(`${TAGS}/${id}`)
      tags.value = tags.value.filter((tag) => tag.id !== id)
    })
  }

  async function toggleTagVisibility(id: string): Promise<void> {
    const tag = findTag(id)
    if (!tag) return
    await updateTag(id, { isHidden: !tag.isHidden })
  }

  async function reorderTags(orderedIds: readonly string[]): Promise<void> {
    const updates = orderedIds
      .map((id, index) => ({ id, index }))
      .filter(({ id, index }) => findTag(id)?.sortOrder !== index)

    // Sequential on purpose: the API rate-limits bursts, so a parallel fan-out would 429.
    for (const { id, index } of updates) {
      // oxlint-disable-next-line no-await-in-loop
      await updateTag(id, { sortOrder: index })
    }
  }

  return {
    tags,
    isLoading,
    errorMessage,
    visibleTags,
    hiddenTagIds,
    tagsById,
    tagNamesById,
    findTag,
    resolveTags,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    toggleTagVisibility,
    reorderTags,
  }
})
