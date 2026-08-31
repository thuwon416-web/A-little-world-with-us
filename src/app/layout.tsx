import type { Metadata, Viewport } from 'next'
import { Dancing_Script, Inter, Playfair_Display, Poppins } from 'next/font/google'

import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister'
import InteractiveCursor from '@/components/effects/InteractiveCursor'
import AmbientBackground from '@/components/effects/ambient-background'
import { Toaster } from '@/components/ui/sonner'

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'A Little World for Us',
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
      lang="en"
      suppressHydrationWarning
      data-theme-mode="midnight"
      className={`${dancingScript.variable} ${poppins.variable} ${playfair.variable} ${inter.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <AmbientBackground density="medium" />
          <InteractiveCursor />
          <ServiceWorkerRegister />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
