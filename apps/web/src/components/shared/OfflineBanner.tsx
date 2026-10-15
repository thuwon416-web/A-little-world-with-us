'use client'

import { useEffect, useState } from 'react'
import { WifiOff, CheckCircle2 } from 'lucide-react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOffline = () => {
      setIsOffline(true)
      setShowReconnected(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, 3500)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none"
    >
      {isOffline ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-card/95 px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 shadow-lg backdrop-blur-md">
          <WifiOff className="h-4 w-4 animate-pulse text-amber-500" />
          <span>Offline mode · Changes will sync automatically when reconnected</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-card/95 px-4 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 shadow-lg backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Back online · Reconnected</span>
        </div>
      )}
    </div>
  )
}
