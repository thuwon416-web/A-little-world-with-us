'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-btn bg-soft-tint p-4 shadow-lg border border-accent-1/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Download className="h-6 w-6 text-accent-1" />
          <div>
            <h3 className="font-semibold text-text-1">
              Install App
            </h3>
            <p className="text-xs text-text-2">
              Add to home screen for quick access
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-2 hover:text-text-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="mt-3 w-full rounded-xl bg-accent-1 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-1/90"
      >
        Install
      </button>
    </div>
  )
}
