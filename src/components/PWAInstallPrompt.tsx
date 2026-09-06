'use client'
import { useEffect, useState } from 'react'

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-[var(--card-bg)] rounded-2xl border border-[var(--accent-1)]/20 shadow-[0_18px_45px_rgba(0,0,0,0.15)] p-4 z-50 animate-fade-in">
      <p className="font-medium text-[var(--text-primary)] mb-2">📲 Install Our Little World</p>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Add to your home screen for quick access to your couple space
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 bg-[var(--accent-1)] hover:bg-[var(--accent-1)]/80 text-white py-2 px-4 rounded-lg font-medium transition"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
        >
          Later
        </button>
      </div>
    </div>
  )
}
