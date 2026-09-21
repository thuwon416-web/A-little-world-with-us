import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'

import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import InteractiveCursor from '@/components/effects/InteractiveCursor'
import AmbientBackground from '@/components/effects/ambient-background'
import { Toaster } from '@/components/ui/sonner'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import AIChatWidget from '@/components/AIChatWidget'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryProvider } from '@/components/QueryProvider'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display' })

const descriptions = [
  'A private little world for KoKo and Pu Tuu â€” memories, love, and every day in between',
  'Our little world â€” where every moment together matters',
  'Two souls, one little world â€” love, care, and everything in between',
  'A quiet space for us â€” memories, moods, and everyday love',
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
  themeColor: 'var(--accent-1)',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="my"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var pref = localStorage.getItem('a-little-world-with-us-theme-preference');
                  var mode = localStorage.getItem('a-little-world-with-us-theme-mode');
                  var legacy = {
                    midnight: 'lavender-mist',
                    sunset: 'peach-cream',
                    romantic: 'mint-whisper',
                    ocean: 'ocean-calm',
                    monochrome: 'monochrome'
                  };
                  var modes = ['lavender-mist','peach-cream','mint-whisper','ocean-calm','monochrome'];
                  var selected = pref || mode;
                  var resolved = legacy[selected] || selected || 'lavender-mist';
                  if (modes.indexOf(resolved) === -1) {
                    resolved = 'lavender-mist';
                  }
                  document.documentElement.dataset.themeMode = resolved;
                  document.documentElement.style.colorScheme =
                    (resolved === 'peach-cream' || resolved === 'mint-whisper' || resolved === 'ocean-calm') ? 'light' : 'dark';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AmbientBackground density="medium" />
              <InteractiveCursor />
              {children}
              <Toaster />
              <PWAInstallPrompt />
              <AIChatWidget />
              <SpeedInsights />
              <WebVitalsReporter />
            </ThemeProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
