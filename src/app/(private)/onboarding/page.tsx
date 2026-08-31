'use client'

import Link from 'next/link'
import { Check, ChevronRight, Heart, Sparkles, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

const steps = [
  {
    title: 'Welcome home',
    blurb: 'Your little world is ready for memories, rituals, and quiet moments together.',
    accent: 'Heart',
  },
  {
    title: 'Capture the feeling',
    blurb: 'Save sweet messages, meaningful photos, and tiny reminders of how you love each other.',
    accent: 'Memories',
  },
  {
    title: 'Stay gently connected',
    blurb: 'Use check-ins, wellness cues, and love notes to care for each other every day.',
    accent: 'Care',
  },
]

const quickStart = [
  'Set your favorite theme for the couple space.',
  'Create a daily ritual or reminder you can both enjoy.',
  'Upload a photo or memory to your gallery.',
  'Visit wellness and check in with each other gently.',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem('our-forever-onboarding')
    if (stored === 'complete') {
      setFinished(true)
    }
  }, [])

  const currentStep = steps[step]

  const completeOnboarding = () => {
    window.localStorage.setItem('our-forever-onboarding', 'complete')
    setFinished(true)
  }

  if (finished) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
            <Heart className="h-8 w-8" />
          </div>

          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">You’re all set</p>
          <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">Welcome back, love.</h1>
          <p className="mt-3 max-w-xl text-[var(--text-secondary)]">
            Your little world is ready. Head to the dashboard or start your next quiet ritual together.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)]"
            >
              Go to dashboard
            </Link>
            <Link
              href="/wellness"
              className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
            >
              Open wellness
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Step {step + 1}/3</p>
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`h-2.5 w-2.5 rounded-full ${step === index ? 'bg-[var(--accent-1)]' : 'bg-white/10'}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[var(--card-bg-strong)] p-5 md:p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
            <Sparkles className="h-6 w-6" />
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">{currentStep.accent}</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">{currentStep.title}</h1>
          <p className="mt-3 max-w-xl text-[var(--text-secondary)]">{currentStep.blurb}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {quickStart.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-[var(--card-bg-strong)] p-4"
            >
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
                <Check className="h-4 w-4" />
              </div>
              <p className="text-sm text-[var(--text-primary)]">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-40"
            disabled={step === 0}
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)]"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={completeOnboarding}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)]"
            >
              Start exploring
              <Star className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
