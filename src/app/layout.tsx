import type { Metadata, Viewport } from 'next'

import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister'
import InteractiveCursor from '@/components/effects/InteractiveCursor'
import AmbientBackground from '@/components/effects/ambient-background'
import { Toaster } from '@/components/ui/sonner'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import AIChatWidget from '@/components/AIChatWidget'

const descriptions = [
  'A private little world for KoKo and Pu Tuu — memories, love, and every day in between',
  'Our little world — where every moment together matters',
  'Two souls, one little world — love, care, and everything in between',
  'A quiet space for us — memories, moods, and everyday love',
  'Just us, our world, and all the little things that make it ours',
]

const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)]
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'A little world with us',
  description: randomDescription,
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192x192.png',
  },
  openGraph: {
    title: 'A little world with us',
    description: randomDescription,
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#FFB6C1',
  width: 'device-width',
  initialScale: 1,
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
            <PWAInstallPrompt />
            <AIChatWidget />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
