'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    setSessionExpired(new URLSearchParams(window.location.search).get('reason') === 'session_expired')
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-modal border border-accent-1/20 bg-card p-7 shadow-xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 fill-current text-accent-1" />
          <h1
            className="text-4xl text-text-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-text-2">Sign in to your little world.</p>
        </div>
        {sessionExpired && (
          <p className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Session expired. Please sign in again.
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-input border border-accent-1/20 bg-card px-4 py-3 text-sm text-text-1 outline-none focus:border-accent-1"
          />
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-input border border-accent-1/20 bg-card px-4 py-3 text-sm text-text-1 outline-none focus:border-accent-1"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-btn bg-accent-1 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-2">
          Need an account?{' '}
          <Link href="/signup" className="text-accent-1 hover:underline">
            Create one
          </Link>
        </p>
      </section>
    </main>
  )
}
