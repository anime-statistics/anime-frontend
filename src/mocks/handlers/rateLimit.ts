import { HttpResponse, type StrictResponse } from 'msw'

interface IRateLimitBody {
  message: string
}

const requestTimestamps: number[] = []
const RATE_LIMIT = 5
const RATE_WINDOW = 1000

export function checkRateLimit(): boolean {
  const now = Date.now()
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_WINDOW) {
    requestTimestamps.shift()
  }
  if (requestTimestamps.length >= RATE_LIMIT) return false
  requestTimestamps.push(now)
  return true
}

export function resetRateLimit(): void {
  requestTimestamps.length = 0
}

export function rateLimitedResponse(): StrictResponse<IRateLimitBody> {
  return HttpResponse.json({ message: 'Too many requests' }, { status: 429 })
}
