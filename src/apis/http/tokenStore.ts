const TOKEN_KEY = 'oauth_token'

export function setOAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function getOAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function clearOAuthToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}
