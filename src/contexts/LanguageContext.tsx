'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Language = 'my' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  my: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.wellness': 'Wellness',
    'nav.chat': 'Chat',
    'nav.memories': 'Memories',
    'nav.calendar': 'Calendar',
    'nav.settings': 'Settings',
    
    // Common
    'common.save': 'သိမ်းမည်',
    'common.cancel': 'ပယ်ဖျက်မည်',
    'common.delete': 'ဖျက်မည်',
    'common.edit': 'ပြင်မည်',
    'common.loading': 'ဖွင့်နေသည်...',
    
    // Auth
    'auth.login': 'ဝင်မည်',
    'auth.logout': 'ထွက်မည်',
    'auth.email': 'အီးမေးလ်',
    'auth.password': 'စကားဝှက်',
    
    // Settings
    'settings.profile': 'ပရိုဖိုင်း',
    'settings.account': 'အကောင့်',
    'settings.privacy': 'လုံခြုံရေး',
    'settings.notifications': 'အကြောင်းကြားချက်များ',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.wellness': 'Wellness',
    'nav.chat': 'Chat',
    'nav.memories': 'Memories',
    'nav.calendar': 'Calendar',
    'nav.settings': 'Settings',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    
    // Settings
    'settings.profile': 'Profile',
    'settings.account': 'Account',
    'settings.privacy': 'Privacy',
    'settings.notifications': 'Notifications',
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('my')

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const saved = localStorage.getItem('a-little-world-with-us-lang') as Language
    if (saved && (saved === 'my' || saved === 'en')) {
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
    return translations[language][key as keyof typeof translations.my] || key
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
