'use client'

import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-1)] to-[var(--bg-2)]">
        <div className="text-center max-w-md px-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
            <Home className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            You&apos;re back online!
          </h1>
          <p className="text-[var(--text-secondary)] mb-4">
            အင်တာနက် ပြန်လည်ချိတ်ဆက်ပြီးပါပြီ
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-1)] px-6 py-3 text-sm font-medium text-[var(--bg-color)] transition-colors hover:bg-[var(--accent-1)]/90"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-1)] to-[var(--bg-2)]">
      <div className="text-center max-w-md px-4">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
          <WifiOff className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-2">
          အင်တာနက် မချိတ်ဆက်ထားပါ
        </p>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          No internet connection. Some features may not work until you&apos;re back online.
          <br />
          <span className="text-xs">
            အင်တာနက် ပြန်လည်ချိတ်ဆက်သည်အထိ အချို့လုပ်ဆောင်ချက်များ အလုပ်မလုပ်နိုင်ပါ
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--button-bg)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--button-bg)]/90"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
            <span className="text-xs opacity-70">/ ပြန်စမ်းသပ်ပါ</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--accent-1)]/30 bg-[var(--bg-2)] px-6 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-2)]/80"
          >
            <Home className="h-4 w-4" />
            Dashboard
            <span className="text-xs opacity-70">/ ဒက်ရှ်ဘုတ်</span>
          </Link>
        </div>
        <p className="mt-8 text-xs text-[var(--text-secondary)]/60">
          Cached content is available for offline viewing
          <br />
          <span className="text-xs">
            ကက်ရှထားသော အကြောင်းအရာများကို offline တွင် ကြည့်ရှုနိုင်ပါသည်
          </span>
        </p>
      </div>
    </div>
  )
}
