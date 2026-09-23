'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Shield, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type TotpFactor = { id: string; factor_type: 'totp'; status: 'verified' | 'unverified'; friendly_name?: string }

export default function TwoFactorAuthWidget() {
  const [factor, setFactor] = useState<TotpFactor | null>(null)
  const [pendingFactorId, setPendingFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refreshFactors = useCallback(async () => {
    const { data, error: factorError } = await supabase.auth.mfa.listFactors()
    if (factorError) throw factorError
    const totpFactors = (data?.all ?? []).filter((item) => item.factor_type === 'totp') as TotpFactor[]
    const verified = totpFactors.find((item) => item.status === 'verified') ?? null
    setFactor(verified)
    return { verified, unverified: totpFactors.find((item) => item.status === 'unverified') ?? null }
  }, [])

  useEffect(() => { void refreshFactors().catch((caught) => setError(caught instanceof Error ? caught.message : 'အတည်ပြုမှုအခြေအနေကို ဖတ်မရပါ။')) }, [refreshFactors])

  const beginSetup = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const existing = await refreshFactors()
      if (existing.verified) {
        setMessage('အကောင့်တွင် အတည်ပြုမှုအဆင့် ၂ ကို ဖွင့်ထားပြီးပါပြီ။')
        return
      }
      if (existing.unverified) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: existing.unverified.id })
        if (removeError) throw removeError
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'A Little World With Us' })
      if (enrollError) throw enrollError
      setPendingFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setCode('')
      setShowSetup(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'စနစ်ထည့်သွင်းမှု မအောင်မြင်ပါ။')
    } finally {
      setLoading(false)
    }
  }

  const verifySetup = async () => {
    if (!pendingFactorId || !/^\d{6}$/.test(code)) return
    setLoading(true)
    setError('')
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: pendingFactorId })
      if (challengeError) throw challengeError
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: pendingFactorId, challengeId: challenge.id, code })
      if (verifyError) throw verifyError
      await refreshFactors()
      setShowSetup(false)
      setPendingFactorId('')
      setQrCode('')
      setSecret('')
      setCode('')
      setMessage('အတည်ပြုမှုအဆင့် ၂ ကို ဖွင့်ပြီးပါပြီ။ နောက်တစ်ကြိမ် ဝင်ရောက်ချိန်တွင် ကုဒ်တောင်းပါမည်။')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'ကုဒ်ကို အတည်မပြုနိုင်ပါ။')
    } finally {
      setLoading(false)
    }
  }

  const cancelSetup = async () => {
    if (pendingFactorId) await supabase.auth.mfa.unenroll({ factorId: pendingFactorId })
    setShowSetup(false)
    setPendingFactorId('')
    setQrCode('')
    setSecret('')
    setCode('')
  }

  const disable = async () => {
    if (!factor || !window.confirm('အကောင့်အတည်ပြုမှုအဆင့် ၂ ကို ပိတ်မှာ သေချာပါသလား။')) return
    setLoading(true)
    setError('')
    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (unenrollError) throw unenrollError
      setFactor(null)
      setMessage('အတည်ပြုမှုအဆင့် ၂ ကို ပိတ်ပြီးပါပြီ။')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'ပိတ်၍မရပါ။ ပြန်ဝင်ပြီး ထပ်ကြိုးစားပါ။')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass-card space-y-4 p-5" aria-labelledby="mfa-title">
      <h2 id="mfa-title" className="flex items-center gap-2 text-lg font-semibold text-text-1"><Shield className="h-5 w-5 text-accent-1" /> အကောင့်အတည်ပြုမှု အဆင့် ၂</h2>
      <p className="text-sm text-text-2">အတည်ပြုပြီးပါက နောက်တစ်ကြိမ် ဝင်ရောက်ချိန်တွင် ဖုန်းရှိ အတည်ပြုအက်ပ်မှ ကုဒ်ကို ထည့်ရပါမည်။</p>
      {factor ? <button type="button" disabled={loading} onClick={() => void disable()} className="w-full rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error disabled:opacity-60">{loading ? 'ခဏစောင့်ပါ…' : 'အဆင့် ၂ အတည်ပြုမှု ပိတ်ရန်'}</button> : <button type="button" disabled={loading} onClick={() => void beginSetup()} className="w-full rounded-xl bg-accent-1 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{loading ? 'ပြင်ဆင်နေသည်…' : 'အဆင့် ၂ အတည်ပြုမှု ဖွင့်ရန်'}</button>}
      {message ? <p role="status" className="text-sm text-success">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {showSetup ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="mfa-setup-title" className="glass-card w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between"><h3 id="mfa-setup-title" className="text-lg font-semibold text-text-1">အတည်ပြုအက်ပ် ချိတ်ဆက်ရန်</h3><button type="button" onClick={() => void cancelSetup()} aria-label="ပိတ်ရန်" className="text-text-2"><X className="h-5 w-5" /></button></div>
        <p className="text-sm text-text-2">စကားဝှက်သိမ်းဆည်းပေးသော အတည်ပြုအက်ပ်ကို ဖွင့်ပြီး QR ပုံကို ဖတ်ပါ။ မဖတ်နိုင်ပါက အောက်ပါသော့ကို အက်ပ်ထဲ ကိုယ်တိုင်ထည့်ပါ။</p>
        {qrCode ? <Image src={qrCode} alt="အတည်ပြုအက်ပ်အတွက် QR ပုံ" width={192} height={192} unoptimized className="mx-auto h-48 w-48 rounded-lg bg-white p-2" /> : null}
        <label className="block text-xs text-text-2" htmlFor="mfa-secret">လက်ဖြင့်ထည့်ရန် သော့</label><input id="mfa-secret" readOnly value={secret} onFocus={(event) => event.currentTarget.select()} className="w-full rounded-lg border border-accent-1/20 bg-card px-3 py-2 font-mono text-xs text-text-1" />
        <label className="block text-sm text-text-1" htmlFor="mfa-code">အတည်ပြုအက်ပ်မှ ဂဏန်း ၆ လုံး</label><input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border border-accent-1/20 bg-card px-3 py-2 text-text-1" />
        {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
        <button type="button" disabled={loading || code.length !== 6} onClick={() => void verifySetup()} className="w-full rounded-xl bg-accent-1 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'စစ်ဆေးနေသည်…' : 'ကုဒ်အတည်ပြုရန်'}</button>
      </section></div> : null}
    </section>
  )
}
