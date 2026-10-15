'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Shield, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

type TotpFactor = { id: string; factor_type: 'totp'; status: 'verified' | 'unverified'; friendly_name?: string }

export default function TwoFactorAuthWidget() {
  const { language } = useLanguage()
  const isMm = language === 'my'

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

  useEffect(() => {
    void refreshFactors().catch((error_) =>
      setError(
        error_ instanceof Error
          ? error_.message
          : isMm
            ? 'အတည်ပြုမှုအခြေအနေကို ဖတ်မရပါ။'
            : 'Unable to check verification status.'
      )
    )
  }, [isMm, refreshFactors])

  const beginSetup = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const existing = await refreshFactors()
      if (existing.verified) {
        setMessage(
          isMm
            ? 'အကောင့်တွင် အတည်ပြုမှုအဆင့် ၂ ကို ဖွင့်ထားပြီးပါပြီ။'
            : 'Two-factor authentication is already active on this account.'
        )
        return
      }
      if (existing.unverified) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: existing.unverified.id })
        if (removeError) throw removeError
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'A Little World With Us',
      })
      if (enrollError) throw enrollError
      setPendingFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setCode('')
      setShowSetup(true)
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : isMm
            ? 'စနစ်ထည့်သွင်းမှု မအောင်မြင်ပါ။'
            : 'Two-factor setup failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const verifySetup = async () => {
    if (!pendingFactorId || !/^\d{6}$/.test(code)) return
    setLoading(true)
    setError('')
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: pendingFactorId,
      })
      if (challengeError) throw challengeError
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: pendingFactorId,
        challengeId: challenge.id,
        code,
      })
      if (verifyError) throw verifyError
      await refreshFactors()
      setShowSetup(false)
      setPendingFactorId('')
      setQrCode('')
      setSecret('')
      setCode('')
      setMessage(
        isMm
          ? 'အတည်ပြုမှုအဆင့် ၂ ကို ဖွင့်ပြီးပါပြီ။ နောက်တစ်ကြိမ် ဝင်ရောက်ချိန်တွင် ကုဒ်တောင်းပါမည်။'
          : 'Two-factor authentication enabled successfully. You will be prompted for a code on future logins.'
      )
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : isMm
            ? 'ကုဒ်ကို အတည်မပြုနိုင်ပါ။'
            : 'Invalid code. Verification failed.'
      )
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
    const confirmPrompt = isMm
      ? 'အကောင့်အတည်ပြုမှုအဆင့် ၂ ကို ပိတ်မှာ သေချာပါသလား။'
      : 'Are you sure you want to disable two-factor authentication?'
    if (!factor || !window.confirm(confirmPrompt)) return
    setLoading(true)
    setError('')
    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (unenrollError) throw unenrollError
      setFactor(null)
      setMessage(
        isMm
          ? 'အတည်ပြုမှုအဆင့် ၂ ကို ပိတ်ပြီးပါပြီ။'
          : 'Two-factor authentication has been disabled.'
      )
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : isMm
            ? 'ပိတ်၍မရပါ။ ပြန်ဝင်ပြီး ထပ်ကြိုးစားပါ။'
            : 'Unable to disable 2FA. Please log in again and retry.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass-card space-y-4 p-5 rounded-panel" aria-labelledby="mfa-title">
      <h2 id="mfa-title" className="flex items-center gap-2 text-lg font-semibold text-text-1">
        <Shield className="h-5 w-5 text-accent-1" />
        {isMm ? 'အကောင့်အတည်ပြုမှု အဆင့် ၂' : 'Two-Factor Authentication'}
      </h2>
      <p className="text-sm text-text-2">
        {isMm
          ? 'အတည်ပြုပြီးပါက နောက်တစ်ကြိမ် ဝင်ရောက်ချိန်တွင် ဖုန်းရှိ အတည်ပြုအက်ပ်မှ ကုဒ်ကို ထည့်ရပါမည်။'
          : 'When enabled, signing in will require a 6-digit code from your authenticator app.'}
      </p>
      {factor ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void disable()}
          className="w-full rounded-pill border border-error/30 bg-error/10 px-3 py-2 text-sm text-error transition hover:bg-error/20 active:scale-[0.98] disabled:opacity-60"
        >
          {loading
            ? isMm
              ? 'ခဏစောင့်ပါ…'
              : 'Please wait…'
            : isMm
              ? 'အဆင့် ၂ အတည်ပြုမှု ပိတ်ရန်'
              : 'Disable Two-Factor Auth'}
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => void beginSetup()}
          className="w-full rounded-pill bg-accent-1 px-3 py-2 text-sm font-medium text-[color:var(--accent-foreground)] shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
        >
          {loading
            ? isMm
              ? 'ပြင်ဆင်နေသည်…'
              : 'Preparing…'
            : isMm
              ? 'အဆင့် ၂ အတည်ပြုမှု ဖွင့်ရန်'
              : 'Enable Two-Factor Auth'}
        </button>
      )}
      {message ? (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
      {showSetup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mfa-setup-title"
            className="glass-card w-full max-w-md space-y-4 p-6 rounded-modal shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 id="mfa-setup-title" className="text-lg font-semibold text-text-1">
                {isMm ? 'အတည်ပြုအက်ပ် ချိတ်ဆက်ရန်' : 'Connect Authenticator App'}
              </h3>
              <button
                type="button"
                onClick={() => void cancelSetup()}
                aria-label={isMm ? 'ပိတ်ရန်' : 'Close'}
                className="text-text-2 hover:text-text-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-text-2">
              {isMm
                ? 'စကားဝှက်သိမ်းဆည်းပေးသော အတည်ပြုအက်ပ်ကို ဖွင့်ပြီး QR ပုံကို ဖတ်ပါ။ မဖတ်နိုင်ပါက အောက်ပါသော့ကို အက်ပ်ထဲ ကိုယ်တိုင်ထည့်ပါ။'
                : 'Open your authenticator app (e.g. Google Authenticator) and scan the QR code, or enter the secret key manually.'}
            </p>
            {qrCode ? (
              <Image
                src={qrCode}
                alt={isMm ? 'အတည်ပြုအက်ပ်အတွက် QR ပုံ' : 'QR code for authenticator app'}
                width={192}
                height={192}
                unoptimized
                className="mx-auto h-48 w-48 rounded-lg bg-white p-2"
              />
            ) : null}
            <label className="block text-xs text-text-2" htmlFor="mfa-secret">
              {isMm ? 'လက်ဖြင့်ထည့်ရန် သော့' : 'Manual Setup Key'}
            </label>
            <input
              id="mfa-secret"
              readOnly
              value={secret}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full rounded-input border border-accent-1/20 bg-card px-3 py-2 font-mono text-xs text-text-1"
            />
            <label className="block text-sm text-text-1" htmlFor="mfa-code">
              {isMm ? 'အတည်ပြုအက်ပ်မှ ဂဏန်း ၆ လုံး' : '6-digit Authenticator Code'}
            </label>
            <input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full rounded-input border border-accent-1/20 bg-card px-3 py-2 text-center font-mono text-base tracking-[0.25em] text-text-1"
            />
            {error ? (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              disabled={loading || code.length !== 6}
              onClick={() => void verifySetup()}
              className="w-full rounded-pill bg-accent-1 px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)] shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              {loading
                ? isMm
                  ? 'စစ်ဆေးနေသည်…'
                  : 'Verifying…'
                : isMm
                  ? 'ကုဒ်အတည်ပြုရန်'
                  : 'Verify Code'}
            </button>
          </section>
        </div>
      ) : null}
    </section>
  )
}
