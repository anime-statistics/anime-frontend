import { z } from 'zod'

// Deliberately loose: unknown fields pass through and wrong-typed fields are
// caught per-field by normaliseSettings. The schema only rejects payloads that
// are not a settings object at all, which triggers the reset-to-defaults path.
export const AppSettingsSchema = z
  .object({
    locale: z.unknown().optional(),
    theme: z.unknown().optional(),
    viewMode: z.unknown().optional(),
    columnsCount: z.unknown().optional(),
    pageSize: z.unknown().optional(),
  })
  .passthrough()

export type IAppSettingsPayload = z.infer<typeof AppSettingsSchema>
