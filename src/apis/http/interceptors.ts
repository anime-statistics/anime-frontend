import type { AxiosInstance } from 'axios'
import { snakeCase } from 'change-case'
import { getOAuthToken } from '@/apis/http/tokenStore'
import { toApiRequestError } from '@/apis/http/errorHandler'
import { deepMapKeys, toCamelCase } from '@/core/utils/caseConverter'
import '@/apis/http/types'

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function applyRequestInterceptor(client: AxiosInstance): number {
  return client.interceptors.request.use((reqConfig) => {
    if (reqConfig.params) {
      reqConfig.params = deepMapKeys(reqConfig.params, snakeCase)
    }
    if (reqConfig.data && !(reqConfig.data instanceof FormData)) {
      reqConfig.data = deepMapKeys(reqConfig.data, snakeCase)
    }

    const oauthToken = getOAuthToken()
    if (oauthToken) {
      reqConfig.headers.set('Authorization', `Bearer ${oauthToken}`)
    }

    const csrfToken = getCsrfToken()
    if (csrfToken && MUTATING_METHODS.has(reqConfig.method?.toLowerCase() ?? '')) {
      reqConfig.headers.set('X-CSRF-Token', csrfToken)
    }

    return reqConfig
  })
}

export function applyResponseInterceptor(client: AxiosInstance): number {
  return client.interceptors.response.use(
    (response) => {
      const converted: unknown = toCamelCase(response.data)
      const schema = response.config.validateResponse

      try {
        response.data = schema ? schema.parse(converted) : converted
      } catch (error) {
        return Promise.reject(toApiRequestError(error))
      }

      return response
    },
    (error: unknown) => Promise.reject(toApiRequestError(error)),
  )
}

export function applyInterceptors(client: AxiosInstance): void {
  applyRequestInterceptor(client)
  applyResponseInterceptor(client)
}
