'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

export default function MfaPage() {
  const router = useRouter()
  const destination = '/dashboard'
  const { language } = useLanguage()
  const isMm = language === 'my'

  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const prepareChallenge = async () => {
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assuranceError) throw assuranceError
      if (assurance?.currentLevel === 'aal2') {
        router.replace(destination)
        return
      }
      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (factorError) throw factorError
      const factor = factors?.totp.find((item) => item.status === 'verified')
      if (!factor) {
        throw new Error(
          isMm
            ? 'အတည်ပြုထားသော စနစ်မတွေ့ပါ။ အကောင့်ဆက်တင်ကို ပြန်စစ်ပါ။'
            : 'No verified MFA factor found. Please check account settings.'
        )
      }
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      })
      if (challengeError) throw challengeError
      if (active) {
        setFactorId(factor.id)
        setChallengeId(challenge.id)
        setReady(true)
      }
    }
    void prepareChallenge().catch((error_) => {
      if (active) {
        setError(
          error_ instanceof Error
            ? error_.message
            : isMm
              ? 'ကုဒ်တောင်း၍ မရပါ။'
              : 'Unable to request MFA challenge.'
        )
      }
    })
    return () => {
      active = false
    }
  }, [destination, isMm, router])

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code) || !factorId || !challengeId || loading) return
    setLoading(true)
    setError('')
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (verifyError) {
      setError(
        isMm
          ? 'ကုဒ်မှားနေသည် သို့မဟုတ် အချိန်ကုန်သွားသည်။ အသစ်ပြန်ထည့်ပါ။'
          : 'Invalid or expired code. Please enter the current code.'
      )
      setCode('')
      setLoading(false)
      return
    }
    router.replace(destination)
    router.refresh()
  }

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md space-y-5 rounded-modal border border-accent-1/20 bg-card p-7 shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-2">
            {isMm ? 'အကောင့်လုံခြုံရေး' : 'Account Security'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text-1">
            {isMm ? 'ဝင်ရောက်မှုကို အတည်ပြုပါ' : 'Two-Factor Verification'}
          </h1>
          <p className="mt-2 text-sm text-text-2">
            {isMm
              ? 'အတည်ပြုအက်ပ်မှ ပြသသော ဂဏန်း ၆ လုံးကို ထည့်ပါ။'
              : 'Enter the 6-digit code shown in your authenticator app.'}
          </p>
        </div>
        {error ? (
          <p role="alert" className="rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        <form className="space-y-4" onSubmit={(event) => void verify(event)}>
          <label htmlFor="mfa-login-code" className="block text-sm font-medium text-text-1">
            {isMm ? 'အတည်ပြုကုဒ်' : 'Verification Code'}
          </label>
          <input
            id="mfa-login-code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full rounded-input border border-accent-1/20 bg-card px-4 py-3 text-center text-lg tracking-[0.3em] text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
          />
          <button
            type="submit"
            disabled={!ready || loading || code.length !== 6}
            className="w-full rounded-pill bg-accent-1 px-4 py-3 text-sm font-semibold font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
          >
            {loading
              ? isMm
                ? 'စစ်ဆေးနေသည်…'
                : 'Verifying…'
              : isMm
                ? 'အတည်ပြုပြီး ဆက်ရန်'
                : 'Verify & Continue'}
          </button>
        </form>
        <Link
          href="/login"
          className="block text-center text-sm text-text-2 hover:text-accent-1 transition-colors"
        >
          {isMm ? 'အကောင့်ဝင်မျက်နှာပြင်သို့ ပြန်ရန်' : 'Return to Login'}
        </Link>
      </section>
    </main>
  )
}
