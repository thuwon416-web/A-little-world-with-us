'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPairStatus } from '@/lib/couple-link'
import { supabase } from '@/lib/supabase'

/**
 * Protects private routes with the current Supabase Auth session.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [pairStatus, setPairStatus] = useState<'accepted' | 'pending' | 'declined' | 'revoked' | 'error' | null>(null)

  useEffect(() => {
    let mounted = true

    const syncSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (!user) {
          router.replace(session ? '/login?reason=session_expired' : '/login')
          return
        }

        setAuthError(null)
        setIsAuth(true)
        try {
          const status = await getPairStatus()
          if (!mounted) return
          setPairStatus(status?.status ?? 'pending')
        } catch {
          if (mounted) setPairStatus('error')
        }
      } catch (caught) {
        if (mounted) {
          console.error('[auth] session check failed:', caught)
          setAuthError('Auth check failed. Please sign in again.')
          setIsAuth(false)
        }
      }
    }

    void syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsAuth(true)
        try {
          const status = await getPairStatus()
          if (!mounted) return
          setPairStatus(status?.status ?? 'pending')
        } catch {
          if (mounted) setPairStatus('error')
        }
      } else {
        setIsAuth(false)
        setPairStatus(null)
        router.replace('/login?reason=session_expired')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-[2rem] border border-[var(--error)]/20 bg-[var(--card-bg)] p-6 text-center shadow-xl backdrop-blur-xl">
          <p className="text-sm text-[var(--error)]">{authError}</p>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="mt-5 rounded-xl bg-[var(--accent-1)] px-4 py-2 font-semibold text-[var(--bg-color)]"
          >
            Go to login
          </button>
        </div>
      </div>
    )
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)] dark:bg-[var(--bg-2)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-1)]" />
      </div>
    )
  }

  if (pairStatus && pairStatus !== 'accepted') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-[2rem] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 text-center shadow-xl backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-secondary)]">Private access</p>
          <h1 className="mt-3 text-3xl text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Couple link required
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {pairStatus === 'error'
              ? 'We could not verify your couple link. Please check the deployed Supabase connection and try again.'
              : pairStatus === 'pending'
              ? 'Your pairing request is waiting for approval.'
              : 'Your couple link is not active yet.'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
