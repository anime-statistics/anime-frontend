import { z } from 'zod'

export const TagDto = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().optional(),
  isHidden: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative(),
})
export type ITagDto = z.infer<typeof TagDto>

export const CreateTagDto = TagDto.omit({ id: true })
export type ICreateTagDto = z.infer<typeof CreateTagDto>

export const UpdateTagDto = CreateTagDto.partial()
export type IUpdateTagDto = z.infer<typeof UpdateTagDto>
