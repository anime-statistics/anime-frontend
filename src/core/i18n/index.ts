import { createI18n } from 'vue-i18n'
import en from '@/core/i18n/en.json'
import ru from '@/core/i18n/ru.json'
import type { AppLocale } from '@/core/i18n/types'

export const DEFAULT_LOCALE: AppLocale = 'ru'
export const FALLBACK_LOCALE: AppLocale = 'en'
export const SUPPORTED_LOCALES: readonly AppLocale[] = ['ru', 'en']

export function russianPluralIndex(choice: number): number {
  const n = Math.abs(choice) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return 2
  if (n1 > 1 && n1 < 5) return 1
  if (n1 === 1) return 0
  return 2
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages: { en, ru },
  pluralRules: {
    ru: russianPluralIndex,
  },
})
