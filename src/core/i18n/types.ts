import type en from '@/core/i18n/en.json'

type MessageLeaf = string

type MessagePaths<T> = T extends MessageLeaf
  ? never
  : {
      [K in keyof T & string]: T[K] extends MessageLeaf ? K : `${K}.${MessagePaths<T[K]>}`
    }[keyof T & string]

export type AppMessageSchema = typeof en

export type AppMessageKey = MessagePaths<AppMessageSchema>

export type AppLocale = 'ru' | 'en'
