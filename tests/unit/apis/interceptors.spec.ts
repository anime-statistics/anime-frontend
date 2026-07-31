import axios, { type AxiosAdapter, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiRequestError } from '@/apis/http/errorHandler'
import { applyInterceptors } from '@/apis/http/interceptors'
import { setOAuthToken } from '@/apis/http/tokenStore'

interface TestClient {
  client: AxiosInstance
  lastRequest: () => InternalAxiosRequestConfig
}

function createTestClient(responseData: unknown = {}): TestClient {
  let captured: InternalAxiosRequestConfig | undefined

  const adapter: AxiosAdapter = async (requestConfig) => {
    captured = requestConfig
    return {
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: requestConfig,
    }
  }

  const client = axios.create({ adapter })
  applyInterceptors(client)

  return {
    client,
    lastRequest: () => {
      if (!captured) throw new Error('no request was captured')
      return captured
    },
  }
}

beforeEach(() => {
  sessionStorage.clear()
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

describe('request interceptor', () => {
  it('converts body keys to snake_case', async () => {
    const { client, lastRequest } = createTestClient()

    await client.post('/anime', { watchedEpisodes: 12, myTags: ['fav'] })

    expect(JSON.parse(lastRequest().data as string)).toEqual({
      watched_episodes: 12,
      my_tags: ['fav'],
    })
  })

  it('converts query params to snake_case', async () => {
    const { client, lastRequest } = createTestClient()

    await client.get('/anime', { params: { pageSize: 20, sortBy: 'score' } })

    expect(lastRequest().params).toEqual({ page_size: 20, sort_by: 'score' })
  })

  it('leaves FormData bodies untouched', async () => {
    const { client, lastRequest } = createTestClient()
    const form = new FormData()
    form.append('myFile', 'content')

    await client.post('/notes', form)

    expect(lastRequest().data).toBeInstanceOf(FormData)
  })

  it('attaches the OAuth token as a bearer header', async () => {
    setOAuthToken('token-123')
    const { client, lastRequest } = createTestClient()

    await client.get('/anime')

    expect(lastRequest().headers.get('Authorization')).toBe('Bearer token-123')
  })

  it('omits the Authorization header when no token is stored', async () => {
    const { client, lastRequest } = createTestClient()

    await client.get('/anime')

    expect(lastRequest().headers.get('Authorization')).toBeUndefined()
  })

  it('sends the CSRF token on mutating requests only', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-abc; path=/'
    const { client, lastRequest } = createTestClient()

    await client.post('/anime', { a: 1 })
    expect(lastRequest().headers.get('X-CSRF-Token')).toBe('csrf-abc')

    await client.get('/anime')
    expect(lastRequest().headers.get('X-CSRF-Token')).toBeUndefined()
  })
})

describe('response interceptor', () => {
  it('converts response keys to camelCase', async () => {
    const { client } = createTestClient({
      episodes_total: 500,
      nested_field: { image_url: 'https://example.com/a.png' },
    })

    const response = await client.get('/anime/1')

    expect(response.data).toEqual({
      episodesTotal: 500,
      nestedField: { imageUrl: 'https://example.com/a.png' },
    })
  })

  it('validates the converted payload against validateResponse', async () => {
    const { client } = createTestClient({ episodes_total: 500 })
    const schema = z.object({ episodesTotal: z.number() })

    const response = await client.get('/anime/1', { validateResponse: schema })

    expect(response.data).toEqual({ episodesTotal: 500 })
  })

  it('rejects with a 422 ApiRequestError when validation fails', async () => {
    const { client } = createTestClient({ episodes_total: 'many' })
    const schema = z.object({ episodesTotal: z.number() })

    await expect(client.get('/anime/1', { validateResponse: schema })).rejects.toSatisfy(
      (error: unknown) => error instanceof ApiRequestError && error.code === 422,
    )
  })

  it('normalises transport failures into ApiRequestError', async () => {
    const client = axios.create({
      adapter: () => Promise.reject(new axios.AxiosError('Network Error', 'ERR_NETWORK')),
    })
    applyInterceptors(client)

    await expect(client.get('/anime')).rejects.toBeInstanceOf(ApiRequestError)
  })
})
