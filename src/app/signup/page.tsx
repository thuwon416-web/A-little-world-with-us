'use client'

import Link from 'next/link'
import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsSubmitting(false)
      return
    }

    if (data.session) {
      router.replace('/dashboard')
      router.refresh()
      return
    }

    setMessage('Account created. Check your email to confirm your address.')
    setIsSubmitting(false)
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Make a safe little space for both of you.
          </p>
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
            placeholder="Password (at least 6 characters)"
            autoComplete="new-password"
            className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]"
          />
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-1)]"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-[var(--accent-1)]">{message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[var(--button-bg)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--accent-1)] hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
