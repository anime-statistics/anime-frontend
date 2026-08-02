import { z } from 'zod'

// Every source contributes two addresses: the page a person reads and the API
// twin the app queries. The API twin can be derived, so it may be absent.
export const ExternalLinkDto = z.object({
  source: z.string().min(1),
  url: z.string().url(),
  apiUrl: z.string().url().optional(),
})
export type IExternalLinkDto = z.infer<typeof ExternalLinkDto>

export const ExternalLinksUpdateDto = z.object({
  externalLinks: z.array(ExternalLinkDto),
})
export type IExternalLinksUpdateDto = z.infer<typeof ExternalLinksUpdateDto>
