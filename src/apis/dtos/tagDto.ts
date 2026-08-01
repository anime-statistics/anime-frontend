import { z } from 'zod'

export const TagDto = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().optional(),
  isHidden: z.boolean().default(false),
  // Seeded watch statuses. Renaming and recolouring them is allowed; deleting
  // them is not, so the vocabulary can never end up empty.
  isSystem: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative(),
})
export type ITagDto = z.infer<typeof TagDto>

export const CreateTagDto = TagDto.omit({ id: true, isSystem: true })
export type ICreateTagDto = z.infer<typeof CreateTagDto>

export const UpdateTagDto = CreateTagDto.partial()
export type IUpdateTagDto = z.infer<typeof UpdateTagDto>

export const BulkTagUpdateDto = z.object({
  ids: z.array(z.string()).min(1),
  add: z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
  // Drops every tag, which is what removing a title from the collection means.
  clear: z.boolean().optional(),
})
export type IBulkTagUpdateDto = z.infer<typeof BulkTagUpdateDto>
