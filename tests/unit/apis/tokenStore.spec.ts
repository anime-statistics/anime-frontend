import { beforeEach, describe, expect, it } from 'vitest'
import { clearOAuthToken, getOAuthToken, setOAuthToken } from '@/apis/http/tokenStore'

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('tokenStore', () => {
  it('returns null when no token is stored', () => {
    expect(getOAuthToken()).toBeNull()
  })

  it('round-trips a token through sessionStorage', () => {
    setOAuthToken('token-123')

    expect(getOAuthToken()).toBe('token-123')
  })

  it('never writes the token to localStorage', () => {
    setOAuthToken('token-123')

    expect(localStorage.length).toBe(0)
  })

  it('clears the stored token', () => {
    setOAuthToken('token-123')
    clearOAuthToken()

    expect(getOAuthToken()).toBeNull()
  })
})
