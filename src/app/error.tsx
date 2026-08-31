'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { logError } from '@/lib/errorLogger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logError(error, {
      source: 'app-error-boundary',
      digest: error.digest ?? 'unknown',
    })
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(244,214,219,0.75),_rgba(250,245,242,1))] px-6 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-rose-200/70 bg-white/80 p-8 text-center shadow-[0_18px_60px_rgba(180,120,130,0.15)] backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-2xl shadow-inner shadow-rose-200">
          💞
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-rose-500">Connection issue</p>
        <h2 className="mt-3 text-3xl font-serif text-rose-900">Something paused the moment</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          We hit a small snag while loading your little world. Please retry, or head back to the
          dashboard while we reconnect.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-rose-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  )
}
