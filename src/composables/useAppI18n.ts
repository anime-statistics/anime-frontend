import { useI18n } from 'vue-i18n'
import type { AppMessageKey } from '@/core/i18n/types'

export type TranslateParams = Record<string, string | number>

export function useAppI18n() {
  const { t, locale } = useI18n()

  function translate(key: AppMessageKey, params?: TranslateParams): string {
    return params ? t(key, params) : t(key)
  }

  function translatePlural(key: AppMessageKey, count: number, params?: TranslateParams): string {
    return t(key, { count, ...params }, count)
  }

  return { translate, translatePlural, locale }
}
