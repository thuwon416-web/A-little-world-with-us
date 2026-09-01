'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, ChevronLeft, Heart, Sparkles, Star, User, Mail, Activity, Moon, Zap } from 'lucide-react'
import {
  getOnboardingProgress,
  initializeOnboarding,
  updateOnboardingStep,
  completeOnboardingStep,
  skipOnboardingStep,
  finishOnboarding,
  saveOnboardingData,
  type OnboardingData,
} from '@/lib/onboarding'

const TOTAL_STEPS = 7

export default function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form data
  const [formData, setFormData] = useState<OnboardingData>({})

  const loadProgress = useCallback(async () => {
    try {
      // Check cookie first for faster redirect
      const onboardingCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('a-little-world-with-us-onboarding='))
        ?.split('=')[1]

      if (onboardingCookie === 'true') {
        router.push('/dashboard')
        return
      }

      const progress = await getOnboardingProgress()
      if (progress) {
        setCurrentStep(progress.current_step)
        setCompletedSteps(progress.completed_steps as number[])
        if (progress.is_completed) {
          // Set cookie if DB says completed but cookie not set
          document.cookie = 'a-little-world-with-us-onboarding=true; path=/; max-age=31536000'
          router.push('/dashboard')
        }
      } else {
        await initializeOnboarding()
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const handleNext = async () => {
    setSaving(true)
    try {
      if (currentStep === 2) {
        await saveOnboardingData(formData)
      }
      const updated = await completeOnboardingStep(currentStep)
      setCurrentStep(updated.current_step)
      setCompletedSteps(updated.completed_steps as number[])
    } catch (error) {
      console.error('Failed to complete step:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = async () => {
    setSaving(true)
    try {
      const prevStep = Math.max(1, currentStep - 1)
      const updated = await updateOnboardingStep(prevStep)
      setCurrentStep(updated.current_step)
    } catch (error) {
      console.error('Failed to go back:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      const updated = await skipOnboardingStep(currentStep)
      setCurrentStep(updated.current_step)
      setCompletedSteps(updated.completed_steps as number[])
    } catch (error) {
      console.error('Failed to skip step:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await saveOnboardingData(formData)
      await finishOnboarding()
      // Set cookie for middleware
      document.cookie = 'a-little-world-with-us-onboarding=true; path=/; max-age=31536000'
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to finish onboarding:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent-1)] border-t-transparent" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--bg-1)] to-[var(--bg-2)] p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Step {currentStep}/{TOTAL_STEPS}
          </p>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
              const stepNum = index + 1
              const isCompleted = completedSteps.includes(stepNum)
              const isCurrent = currentStep === stepNum
              return (
                <span
                  key={index}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    isCompleted
                      ? 'bg-[var(--accent-1)]'
                      : isCurrent
                      ? 'bg-[var(--accent-1)] scale-125'
                      : 'bg-white/10'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
          {currentStep === 1 && <WelcomeStep onNext={handleNext} />}
          {currentStep === 2 && (
            <ProfileStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              saving={saving}
            />
          )}
          {currentStep === 3 && (
            <PartnerStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              saving={saving}
            />
          )}
          {currentStep === 4 && (
            <HealthStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              saving={saving}
            />
          )}
          {currentStep === 5 && (
            <CycleStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              saving={saving}
            />
          )}
          {currentStep === 6 && (
            <AstrologyStep
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              saving={saving}
            />
          )}
          {currentStep === 7 && <CompleteStep onFinish={handleFinish} saving={saving} />}
        </div>
      </div>
    </main>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
        <Heart className="h-8 w-8" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Welcome</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">
          Welcome to your little world
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          A private space for you and your partner to share memories, stay connected, and care for each other.
        </p>
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-3 text-sm font-medium text-[var(--bg-color)] transition-colors hover:bg-[var(--accent-1)]/90"
      >
        Get Started
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function ProfileStep({
  data,
  onChange,
  onNext,
  onBack,
  saving,
}: {
  data: OnboardingData
  onChange: (data: OnboardingData) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
        <User className="h-6 w-6" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Profile</p>
        <h1 className="mt-3 text-2xl font-serif text-[var(--text-primary)]">
          Tell us about yourself
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          This helps us personalize your experience.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-[var(--text-secondary)]">Name</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Your name"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--text-secondary)]">Birth Date</label>
          <input
            type="date"
            value={data.birth_date || ''}
            onChange={(e) => onChange({ ...data, birth_date: e.target.value })}
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--text-secondary)]">Gender (Optional)</label>
          <select
            value={data.gender || ''}
            onChange={(e) => onChange({ ...data, gender: e.target.value as 'male' | 'female' | 'other' | 'prefer_not_to_say' })}
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)]"
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          disabled={saving}
          className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-40"
        >
          <ChevronLeft className="mr-2 inline h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-2 text-sm font-medium text-[var(--bg-color)] disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Next'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function PartnerStep({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
  saving,
}: {
  data: OnboardingData
  onChange: (data: OnboardingData) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
        <Mail className="h-6 w-6" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Partner</p>
        <h1 className="mt-3 text-2xl font-serif text-[var(--text-primary)]">
          Invite your partner
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Share this space with someone special.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-[var(--text-secondary)]">Partner Email</label>
        <input
          type="email"
          value={data.partner_email || ''}
          onChange={(e) => onChange({ ...data, partner_email: e.target.value })}
          placeholder="partner@example.com"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          disabled={saving}
          className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-40"
        >
          <ChevronLeft className="mr-2 inline h-4 w-4" />
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={saving}
            className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-40"
          >
            Skip for now
          </button>
          <button
            onClick={onNext}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-2 text-sm font-medium text-[var(--bg-color)] disabled:opacity-40"
          >
            {saving ? 'Sending...' : 'Send Invite'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function HealthStep({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
  saving,
}: {
  data: OnboardingData
  onChange: (data: OnboardingData) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
        <Activity className="h-6 w-6" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Health</p>
        <h1 className="mt-3 text-2xl font-serif text-[var(--text-primary)]">
          Health Profile
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Optional - helps with wellness features.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-[var(--text-secondary)]">Blood Type</label>
          <select
            value={data.blood_type || ''}
            onChange={(e) => onChange({ ...data, blood_type: e.target.value })}
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)]"
          >
            <option value="">Select...</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm text-[var(--text-secondary)]">Height (cm)</label>
            <input
              type="number"
              value={data.height_cm || ''}
              onChange={(e) => onChange({ ...data, height_cm: parseInt(e.target.value) || undefined })}
              placeholder="170"
              className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[var(--text-secondary)]">Weight (kg)</label>
            <input
              type="number"
              value={data.weight_kg || ''}
              onChange={(e) => onChange({ ...data, weight_kg: parseFloat(e.target.value) || undefined })}
              placeholder="70"
              className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          disabled={saving}
          className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-40"
        >
          <ChevronLeft className="mr-2 inline h-4 w-4" />
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={saving}
            className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-40"
          >
            Skip for now
          </button>
          <button
            onClick={onNext}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-2 text-sm font-medium text-[var(--bg-color)] disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function CycleStep({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
  saving,
}: {
  data: OnboardingData
  onChange: (data: OnboardingData) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
        <Moon className="h-6 w-6" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Cycle</p>
        <h1 className="mt-3 text-2xl font-serif text-[var(--text-primary)]">
          Cycle Tracking
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Optional - for female users.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-[var(--text-secondary)]">Last Period Start</label>
          <input
            type="date"
            value={data.last_period_date || ''}
            onChange={(e) => onChange({ ...data, last_period_date: e.target.value })}
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--text-secondary)]">Cycle Length (days)</label>
          <input
            type="number"
            value={data.cycle_length || ''}
            onChange={(e) => onChange({ ...data, cycle_length: parseInt(e.target.value) || undefined })}
            placeholder="28"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          disabled={saving}
          className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-40"
        >
          <ChevronLeft className="mr-2 inline h-4 w-4" />
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={saving}
            className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-40"
          >
            Skip for now
          </button>
          <button
            onClick={onNext}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-2 text-sm font-medium text-[var(--bg-color)] disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AstrologyStep({
  data: _data,
  onChange: _onChange,
  onNext,
  onBack,
  onSkip,
  saving,
}: {
  data: OnboardingData
  onChange: (data: OnboardingData) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
        <Zap className="h-6 w-6" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Astrology</p>
        <h1 className="mt-3 text-2xl font-serif text-[var(--text-primary)]">
          Astrology Profile
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Optional - birth date already collected.
        </p>
      </div>

      <div className="rounded-xl bg-[var(--bg-2)] p-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Your astrology profile will be automatically calculated from your birth date. You can view it in the wellness section.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          disabled={saving}
          className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-40"
        >
          <ChevronLeft className="mr-2 inline h-4 w-4" />
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={saving}
            className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-40"
          >
            Skip for now
          </button>
          <button
            onClick={onNext}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-2 text-sm font-medium text-[var(--bg-color)] disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function CompleteStep({ onFinish, saving }: { onFinish: () => void; saving: boolean }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
        <Sparkles className="h-8 w-8" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Complete</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">
          You&apos;re all set!
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Your little world is ready. Start exploring and create beautiful moments together.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-2)] p-3 text-left">
          <Check className="h-5 w-5 text-[var(--accent-1)]" />
          <span className="text-sm text-[var(--text-primary)]">Profile created</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-2)] p-3 text-left">
          <Check className="h-5 w-5 text-[var(--accent-1)]" />
          <span className="text-sm text-[var(--text-primary)]">Ready to connect</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-2)] p-3 text-left">
          <Check className="h-5 w-5 text-[var(--accent-1)]" />
          <span className="text-sm text-[var(--text-primary)]">Wellness features enabled</span>
        </div>
      </div>

      <button
        onClick={onFinish}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-3 text-sm font-medium text-[var(--bg-color)] disabled:opacity-40"
      >
        {saving ? 'Finishing...' : 'Go to Dashboard'}
        <Star className="h-4 w-4" />
      </button>
    </div>
  )
}
