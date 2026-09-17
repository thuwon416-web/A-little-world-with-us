'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import en from '@/i18n/locales/en.json'
import my from '@/i18n/locales/my.json'

type Language = 'my' | 'en'
type TranslationTree = { [key: string]: string | TranslationTree }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('my')

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const storedLocale = (
      localStorage.getItem('a-little-world-with-us-locale') ??
      localStorage.getItem('a-little-world-with-us-lang')
    )
    const saved = storedLocale === 'mm' ? 'my' : storedLocale
    if (saved === 'my' || saved === 'en') {
      setLanguageState(saved)
      if (storedLocale === 'mm') {
        localStorage.setItem('a-little-world-with-us-locale', 'my')
        localStorage.setItem('a-little-world-with-us-lang', 'my')
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('a-little-world-with-us-lang', lang)
      localStorage.setItem('a-little-world-with-us-locale', lang)
    }
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: string | TranslationTree | undefined = language === 'en' ? en : my

    for (const k of keys) {
      value = typeof value === 'object' && value !== null ? value[k] : undefined
    }

    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
