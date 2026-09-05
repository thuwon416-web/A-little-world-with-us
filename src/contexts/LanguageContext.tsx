'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import en from '@/i18n/locales/en.json'
import mm from '@/i18n/locales/mm.json'

type Language = 'mm' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('mm')

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const saved = localStorage.getItem('a-little-world-with-us-lang') as Language
    if (saved && (saved === 'mm' || saved === 'en')) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('a-little-world-with-us-lang', lang)
    }
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = language === 'en' ? en : mm

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
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
