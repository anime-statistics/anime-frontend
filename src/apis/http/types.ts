import type { ZodType } from 'zod'

declare module 'axios' {
  interface AxiosRequestConfig {
    validateResponse?: ZodType
  }
}
