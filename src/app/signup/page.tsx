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
      <section className="w-full max-w-md rounded-modal border border-accent-1/20 bg-card p-7 shadow-xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 fill-current text-accent-1" />
          <h1
            className="text-4xl text-text-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Create your account
          </h1>
          <p className="mt-2 text-sm text-text-2">
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
            className="w-full rounded-input border border-accent-1/20 bg-card px-4 py-3 text-sm text-text-1 outline-none focus:border-accent-1"
          />
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (at least 6 characters)"
            autoComplete="new-password"
            className="w-full rounded-input border border-accent-1/20 bg-card px-4 py-3 text-sm text-text-1 outline-none focus:border-accent-1"
          />
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            className="w-full rounded-input border border-accent-1/20 bg-card px-4 py-3 text-sm text-text-1 outline-none focus:border-accent-1"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-accent-1">{message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-btn bg-accent-1 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-2">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-1 hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
