'use client'

import { useState, type FormEvent } from 'react'

export default function FeedbackWidget() {
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
        throw new Error(result?.error || 'တုံ့ပြန်ချက်ကို ပို့မရပါ။ နောက်မှ ထပ်ကြိုးစားပါ။')
      }
      setFeedback('')
      setMessage('တုံ့ပြန်ချက်ကို ပို့ပြီးပါပြီ။ ကျေးဇူးတင်ပါတယ်။')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'တုံ့ပြန်ချက်ကို ပို့မရပါ။')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-modal border border-border bg-card p-5" aria-labelledby="feedback-title">
      <h2 id="feedback-title" className="text-xl font-semibold text-text-1">အကြံပြုချက်ပေးရန်</h2>
      <p className="mt-1 text-sm text-text-2">တွေ့ရတဲ့အမှား သို့မဟုတ် ပြင်ဆင်စေချင်တာကို ရေးပို့နိုင်ပါတယ်။</p>
      <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
        <label htmlFor="feedback-message" className="sr-only">အကြံပြုချက်</label>
        <textarea
          id="feedback-message"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          maxLength={5000}
          required
          rows={4}
          placeholder="အကြံပြုချက်ကို ဒီမှာရေးပါ…"
          className="w-full rounded-xl border border-border bg-card/40 px-3 py-2 text-text-1 placeholder:text-text-2"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-text-2">{feedback.length}/၅,၀၀၀</span>
          <button type="submit" disabled={busy || !feedback.trim()} className="rounded-xl bg-accent-1 px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)] disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? 'ပို့နေသည်…' : 'ပို့ရန်'}
          </button>
        </div>
      </form>
      {message ? <p role="status" className="mt-3 text-sm text-success">{message}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </section>
  )
}
