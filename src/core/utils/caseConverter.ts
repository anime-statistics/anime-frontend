import { camelCase, snakeCase } from 'change-case'

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function deepMapKeys<T>(obj: T, mapFn: (key: string) => string): T {
  if (Array.isArray(obj)) {
    return obj.map((item: unknown) => deepMapKeys(item, mapFn)) as T
  }

  if (isPlainObject(obj)) {
    return Object.keys(obj).reduce<Record<string, unknown>>((acc, key) => {
      acc[mapFn(key)] = deepMapKeys(obj[key], mapFn)
      return acc
    }, {}) as T
  }

  return obj
}

export function toCamelCase<T>(obj: T): T {
  return deepMapKeys(obj, camelCase)
}

export function toSnakeCase<T>(obj: T): T {
  return deepMapKeys(obj, snakeCase)
}
