import { z } from 'zod'

export const NoteDto = z.object({
  id: z.string().uuid(),
  mediaId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type INoteDto = z.infer<typeof NoteDto>

export const CreateNoteDto = NoteDto.omit({ id: true, createdAt: true, updatedAt: true })
export type ICreateNoteDto = z.infer<typeof CreateNoteDto>
