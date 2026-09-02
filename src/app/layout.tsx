import type { Metadata, Viewport } from 'next'

import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister'
import InteractiveCursor from '@/components/effects/InteractiveCursor'
import AmbientBackground from '@/components/effects/ambient-background'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'A Little World With Us',
  description:
    'A private little world for KoKo and Pu Tuu — memories, love, and every day in between.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#FFB6C1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="my"
      suppressHydrationWarning
      data-theme-mode="midnight"
    >
      <body className="min-h-screen font-sans antialiased">
        <LanguageProvider>
          <ThemeProvider>
            <AmbientBackground density="medium" />
            <InteractiveCursor />
            <ServiceWorkerRegister />
            {children}
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
