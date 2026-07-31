import axios from 'axios'
import { ZodError } from 'zod'

export interface ApiValidationIssue {
  path: string
  message: string
}

export interface ApiError {
  message: string
  code: number
  validationErrors?: ApiValidationIssue[]
}

export class ApiRequestError extends Error {
  readonly code: number
  readonly validationErrors?: ApiValidationIssue[]

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'ApiRequestError'
    this.code = apiError.code
    this.validationErrors = apiError.validationErrors
  }
}

function readServerMessage(data: unknown): string | null {
  if (data !== null && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message: unknown }
    if (typeof message === 'string') return message
  }
  return null
}

export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return {
        message: readServerMessage(error.response.data) ?? error.message,
        code: error.response.status,
      }
    }
    if (error.code === 'ERR_CANCELED') return { message: 'Request was cancelled', code: 0 }
    return { message: error.message, code: 0 }
  }

  if (error instanceof ZodError) {
    return {
      message: 'DTO validation failed',
      code: 422,
      validationErrors: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }
  }

  return { message: 'Неизвестная ошибка', code: 500 }
}

export function toApiRequestError(error: unknown): ApiRequestError {
  return error instanceof ApiRequestError ? error : new ApiRequestError(handleApiError(error))
}
