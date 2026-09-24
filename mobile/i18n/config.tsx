import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import en from './messages/en.json'
import my from './messages/my.json'

export type Locale = 'en' | 'my'
const STORAGE_KEY = 'a-little-world-with-us-locale'
const DEFAULT_LANGUAGE_VERSION_KEY = 'a-little-world-with-us-default-language-v2'
type Messages = typeof en
const messages: Record<Locale, Messages> = { en, my }

type I18nContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    void Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(DEFAULT_LANGUAGE_VERSION_KEY)]).then(([stored, version]) => {
      if (!version) {
        setLocaleState('en')
        void AsyncStorage.multiSet([[STORAGE_KEY, 'en'], [DEFAULT_LANGUAGE_VERSION_KEY, '1']])
        return
      }
      if (stored === 'en' || stored === 'my') setLocaleState(stored)
    })
  }, [])

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (next: Locale) => {
      setLocaleState(next)
      void AsyncStorage.setItem(STORAGE_KEY, next)
    }
    const t = (key: string) => {
      const result = key
        .split('.')
        .reduce<unknown>(
          (current, part) =>
            typeof current === 'object' && current !== null
              ? (current as Record<string, unknown>)[part]
              : undefined,
          messages[locale]
        )
      return typeof result === 'string' ? result : key
    }
    return { locale, setLocale, t }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useTranslation must be used within I18nProvider')
  return context
}
