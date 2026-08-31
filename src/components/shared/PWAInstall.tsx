'use client'

import { Download, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function PWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (!('navigator' in window)) return

    const handler = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const appInstalled = () => setIsInstalled(true)

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', appInstalled)

    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', appInstalled)
    }
  }, [])

  if (isInstalled || !installPrompt) return null

  const handleInstall = async () => {
    if (!installPrompt) return

    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-[0_14px_30px_rgba(0,0,0,0.12)] transition hover:border-[var(--accent-1)]/40"
    >
      <Sparkles className="h-4 w-4 text-[var(--accent-2)]" />
      <Download className="h-4 w-4" />
      Install app
    </button>
  )
}
