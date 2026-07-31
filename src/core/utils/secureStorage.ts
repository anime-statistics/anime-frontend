// XOR + base64 is deliberate per spec: it keeps API keys from being readable
// at a glance in devtools, nothing more. Real secrecy needs a backend vault.
const CIPHER_KEY = 'anime-statistics-local-cipher'
const STORAGE_PREFIX = 'anime-statistics:secret:'

function xor(text: string): string {
  let result = ''
  for (let index = 0; index < text.length; index += 1) {
    result += String.fromCharCode(
      text.charCodeAt(index) ^ CIPHER_KEY.charCodeAt(index % CIPHER_KEY.length),
    )
  }
  return result
}

function encodeBinary(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
}

function decodeBinary(encoded: string): string {
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function saveSecret(name: string, value: string): void {
  if (!value) {
    localStorage.removeItem(`${STORAGE_PREFIX}${name}`)
    return
  }
  localStorage.setItem(`${STORAGE_PREFIX}${name}`, encodeBinary(xor(value)))
}

export function readSecret(name: string): string {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${name}`)
  if (!stored) return ''

  try {
    return xor(decodeBinary(stored))
  } catch {
    return ''
  }
}

export function clearSecret(name: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${name}`)
}
