'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

export default function MfaPage() {
  const router = useRouter()
  const destination = '/dashboard'
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const prepareChallenge = async () => {
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assuranceError) throw assuranceError
      if (assurance?.currentLevel === 'aal2') {
        router.replace(destination)
        return
      }
      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (factorError) throw factorError
      const factor = factors?.totp.find((item) => item.status === 'verified')
      if (!factor) throw new Error('အတည်ပြုထားသော စနစ်မတွေ့ပါ။ အကောင့်ဆက်တင်ကို ပြန်စစ်ပါ။')
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id })
      if (challengeError) throw challengeError
      if (active) {
        setFactorId(factor.id)
        setChallengeId(challenge.id)
        setReady(true)
      }
    }
    void prepareChallenge().catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : 'ကုဒ်တောင်း၍ မရပါ။')
    })
    return () => { active = false }
  }, [destination, router])

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code) || !factorId || !challengeId || loading) return
    setLoading(true)
    setError('')
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (verifyError) {
      setError('ကုဒ်မှားနေသည် သို့မဟုတ် အချိန်ကုန်သွားသည်။ အသစ်ပြန်ထည့်ပါ။')
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
        <div><p className="text-xs uppercase tracking-[0.2em] text-text-2">အကောင့်လုံခြုံရေး</p><h1 className="mt-2 text-3xl font-semibold text-text-1">ဝင်ရောက်မှုကို အတည်ပြုပါ</h1><p className="mt-2 text-sm text-text-2">အတည်ပြုအက်ပ်မှ ပြသသော ဂဏန်း ၆ လုံးကို ထည့်ပါ။</p></div>
        {error ? <p role="alert" className="rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</p> : null}
        <form className="space-y-4" onSubmit={(event) => void verify(event)}>
          <label htmlFor="mfa-login-code" className="block text-sm font-medium text-text-1">အတည်ပြုကုဒ်</label>
          <input id="mfa-login-code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border border-accent-1/20 bg-card px-4 py-3 text-lg tracking-[0.3em] text-text-1" />
          <button type="submit" disabled={!ready || loading || code.length !== 6} className="w-full rounded-xl bg-accent-1 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'စစ်ဆေးနေသည်…' : 'အတည်ပြုပြီး ဆက်ရန်'}</button>
        </form>
        <Link href="/login" className="block text-center text-sm text-text-2 hover:text-accent-1">အကောင့်ဝင်မျက်နှာပြင်သို့ ပြန်ရန်</Link>
      </section>
    </main>
  )
}
