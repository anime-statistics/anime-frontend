import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiRequestError, handleApiError, toApiRequestError } from '@/apis/http/errorHandler'

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const error = new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config)
  error.response = {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  } as AxiosError['response']
  return error
}

describe('handleApiError', () => {
  it('reads the server message from a response body', () => {
    const result = handleApiError(axiosErrorWithResponse(404, { message: 'Anime not found' }))

    expect(result).toEqual({ message: 'Anime not found', code: 404 })
  })

  it('falls back to the axios message when the body has none', () => {
    const result = handleApiError(axiosErrorWithResponse(500, null))

    expect(result).toEqual({ message: 'Request failed', code: 500 })
  })

  it('reports cancelled requests with code 0', () => {
    const error = new AxiosError('canceled', 'ERR_CANCELED')

    expect(handleApiError(error)).toEqual({ message: 'Request was cancelled', code: 0 })
  })

  it('reports network errors with code 0', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')

    expect(handleApiError(error)).toEqual({ message: 'Network Error', code: 0 })
  })

  it('maps ZodError issues to 422 validation errors', () => {
    const schema = z.object({ title: z.string(), score: z.number() })
    const parsed = schema.safeParse({ title: 42, score: 'high' })
    expect(parsed.success).toBe(false)

    const result = handleApiError(parsed.error)

    expect(result.code).toBe(422)
    expect(result.message).toBe('DTO validation failed')
    expect(result.validationErrors?.map((issue) => issue.path)).toEqual(['title', 'score'])
  })

  it('falls back to a generic error for unknown values', () => {
    expect(handleApiError('boom')).toEqual({ message: 'Неизвестная ошибка', code: 500 })
  })
})

describe('toApiRequestError', () => {
  it('wraps an unknown error into an Error subclass', () => {
    const error = toApiRequestError(axiosErrorWithResponse(403, { message: 'Forbidden' }))

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.message).toBe('Forbidden')
    expect(error.code).toBe(403)
  })

  it('passes an existing ApiRequestError through unchanged', () => {
    const original = new ApiRequestError({ message: 'already wrapped', code: 400 })

    expect(toApiRequestError(original)).toBe(original)
  })
})
