import { describe, expect, it } from 'vitest'

describe('project setup', () => {
  it('resolves env variables from env/ directory', () => {
    expect(import.meta.env.VITE_API_BASE_URL).toBe('/api/v1/')
    expect(import.meta.env.VITE_API_TIMEOUT).toBe('15000')
  })

  it('runs in a DOM-capable environment', () => {
    expect(typeof document).toBe('object')
    expect(document.createElement('div').tagName).toBe('DIV')
  })
})
