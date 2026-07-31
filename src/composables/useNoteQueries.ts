import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { apiClient } from '@/apis/http/client'
import type { ICreateNoteDto, INoteDto } from '@/apis/dtos/noteDto'
import { validateNoteDto, validateNoteDtoArray } from '@/apis/validators/noteValidators'
import { NOTES } from '@/core/constants/apiRoutes'
import { isObject } from '@/core/utils/caseConverter'

export const noteKeys = {
  all: ['notes'] as const,
  byMedia: (mediaId: Ref<string> | string) => [...noteKeys.all, 'media', mediaId] as const,
}

export function useNotes(mediaId: Ref<string>) {
  return useQuery({
    queryKey: noteKeys.byMedia(mediaId),
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<unknown>(NOTES, {
        params: { mediaId: mediaId.value },
        signal,
      })
      if (!isObject(data)) throw new Error('Unexpected notes response')
      return validateNoteDtoArray(data.items)
    },
    enabled: computed(() => mediaId.value.length > 0),
  })
}

export function useCreateNote(mediaId: Ref<string>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ICreateNoteDto): Promise<INoteDto> => {
      const { data } = await apiClient.post<unknown>(NOTES, payload)
      return validateNoteDto(data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noteKeys.byMedia(mediaId.value) })
    },
  })
}

export function useUpdateNote(mediaId: Ref<string>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { id: string, content: string }): Promise<INoteDto> => {
      const { data } = await apiClient.patch<unknown>(`${NOTES}/${variables.id}`, {
        content: variables.content,
      })
      return validateNoteDto(data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noteKeys.byMedia(mediaId.value) })
    },
  })
}

export function useDeleteNote(mediaId: Ref<string>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`${NOTES}/${id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noteKeys.byMedia(mediaId.value) })
    },
  })
}
