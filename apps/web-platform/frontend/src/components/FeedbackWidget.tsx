'use client'

import { useState, type FormEvent } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function FeedbackWidget() {
  const { language } = useLanguage()
  const isMm = language === 'my'

  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = feedback.trim()
    if (!value || busy) return

    setBusy(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: value }),
      })
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(
          result?.error ||
            (isMm
              ? 'တုံ့ပြန်ချက်ကို ပို့မရပါ။ နောက်မှ ထပ်ကြိုးစားပါ။'
              : 'Unable to send feedback. Please try again later.')
        )
      }
      setFeedback('')
      setMessage(
        isMm ? 'တုံ့ပြန်ချက်ကို ပို့ပြီးပါပြီ။ ကျေးဇူးတင်ပါတယ်။' : 'Feedback submitted. Thank you!'
      )
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : isMm
            ? 'တုံ့ပြန်ချက်ကို ပို့မရပါ။'
            : 'Unable to send feedback.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="rounded-modal border border-border bg-card p-5 shadow-card"
      aria-labelledby="feedback-title"
    >
      <h2 id="feedback-title" className="text-xl font-semibold text-text-1">
        {isMm ? 'အကြံပြုချက်ပေးရန်' : 'Send Feedback'}
      </h2>
      <p className="mt-1 text-sm text-text-2">
        {isMm
          ? 'တွေ့ရတဲ့အမှား သို့မဟုတ် ပြင်ဆင်စေချင်တာကို ရေးပို့နိုင်ပါတယ်။'
          : 'Report an issue or suggest an improvement to make our space better.'}
      </p>
      <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
        <label htmlFor="feedback-message" className="sr-only">
          {isMm ? 'အကြံပြုချက်' : 'Feedback'}
        </label>
        <textarea
          id="feedback-message"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          maxLength={5000}
          required
          rows={4}
          placeholder={isMm ? 'အကြံပြုချက်ကို ဒီမှာရေးပါ…' : 'Write your feedback here…'}
          className="w-full rounded-xl border border-border bg-card/40 px-3 py-2 text-text-1 placeholder:text-text-2 focus:outline-none focus:ring-1 focus:ring-accent-1"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-text-2">{feedback.length}/5,000</span>
          <button
            type="submit"
            disabled={busy || !feedback.trim()}
            className="rounded-pill bg-accent-1 px-4 py-2 text-sm font-semibold text-white font-semibold shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (isMm ? 'ပို့နေသည်…' : 'Sending…') : isMm ? 'ပို့ရန်' : 'Send Feedback'}
          </button>
        </div>
      </form>
      {message ? (
        <p role="status" className="mt-3 text-sm text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      ) : null}
    </section>
  )
}
