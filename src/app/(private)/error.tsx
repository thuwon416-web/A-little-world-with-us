'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { logError } from '@/lib/errorLogger'

export default function PrivateError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logError(error, {
      source: 'private-route-error-boundary',
      digest: error.digest ?? 'unknown',
    })
  }, [error])

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-8 text-center shadow-lg">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--accent-1)]">Private area</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          We could not load this part of your little world. Please try again or return to the
          dashboard.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-[var(--accent-1)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-[var(--accent-1)]/25 px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
