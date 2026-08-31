'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      <section className="w-full max-w-md rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-7 shadow-xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 fill-current text-[var(--accent-1)]" />
          <h1
            className="text-4xl text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Sign in to your little world.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]"
          />
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[var(--button-bg)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
          Need an account?{' '}
          <Link href="/signup" className="text-[var(--accent-1)] hover:underline">
            Create one
          </Link>
        </p>
      </section>
    </main>
  )
}
