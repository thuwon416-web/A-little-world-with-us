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
  const [pairStatus, setPairStatus] = useState<'accepted' | 'pending' | 'declined' | 'revoked' | null>(null)

  useEffect(() => {
    let mounted = true

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (!session) {
        router.replace('/login')
        return
      }

      setIsAuth(true)

      const status = await getPairStatus()
      if (!mounted) return
      setPairStatus(status?.status ?? 'pending')
    }

    syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsAuth(true)
        const status = await getPairStatus()
        if (!mounted) return
        setPairStatus(status?.status ?? 'pending')
      } else {
        setIsAuth(false)
        setPairStatus(null)
        router.replace('/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

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
            {pairStatus === 'pending'
              ? 'Your pairing request is waiting for approval.'
              : 'Your couple link is not active yet.'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
