'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, X, CheckCircle } from 'lucide-react'

interface RetrogradePeriod {
  planet: string
  planetMy: string
  startDate: Date
  endDate: Date
  whatToAvoid: string[]
  whatToAvoidMy: string[]
  advice: string
  adviceMy: string
}

// Mercury retrograde dates for 2024-2025 (simplified)
const retrogradePeriods: RetrogradePeriod[] = [
  {
    planet: 'Mercury',
    planetMy: 'ဗုဒ္ဓိ',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-04-25'),
    whatToAvoid: [
      'Signing important contracts',
      'Making major purchases',
      'Starting new projects',
      'Travel to unfamiliar places',
    ],
    whatToAvoidMy: [
      'အရေးကြီးသောစာချုပ်များလက်မှတ်ရေးထိုးခြင်း',
      'အဓိကဝယ်ယူမှုများပြုလုပ်ခြင်း',
      'ပရောဂျီအသစ်များစတင်ခြင်း',
      'မသိသောနေရာများသို့ခရီးသွားခြင်း',
    ],
    advice: 'Double-check all communications. Back up important data. Be patient with misunderstandings.',
    adviceMy: 'ဆက်သွယ်ရေးတွေကို နှစ်ကြိမ်စစ်ဆေးပါ။ အရေးကြီးသောဒေတာတွေကို သိမ်းဆည်းပါ။ မကျေနပ်မှုတွေကို ခံစားနိုင်ပါ။',
  },
  {
    planet: 'Venus',
    planetMy: 'ဇောက်',
    startDate: new Date('2024-07-22'),
    endDate: new Date('2024-09-03'),
    whatToAvoid: [
      'Major relationship decisions',
      'Expensive luxury purchases',
      'New beauty treatments',
      'Financial investments',
    ],
    whatToAvoidMy: [
      'အဓိကဆက်ဆံရေးဆုံးဖြတ်ချက်များ',
      'ဈေးကြီးသောလူသုံးကုန်ဝယ်ယူမှုများ',
      'အလှကုထရိုက်မင့်အသစ်များ',
      'ငွေကြေးရင်းနှီးမြှုပ်နှံမှုများ',
    ],
    advice: 'Reconnect with old flames. Revisit past relationship patterns. Focus on self-love.',
    adviceMy: 'ရှေ့ယခင်ချစ်စရာစိတ်တွေနှင့် ပြန်ဆက်သွယ်ပါ။ အတိတ်ဆက်ဆံရေးပုံစံတွေကို ပြန်စစ်ဆေးပါ။ ကိုယ်ပိုင်ချစ်စရာစိတ်ကို အဓိကထားပါ။',
  },
  {
    planet: 'Mars',
    planetMy: 'အင်္ဂါ',
    startDate: new Date('2024-12-06'),
    endDate: new Date('2025-02-23'),
    whatToAvoid: [
      'Starting new ventures',
      'Aggressive confrontations',
      'Risky physical activities',
      'Making impulsive decisions',
    ],
    whatToAvoidMy: [
      'လုပ်ငန်းအသစ်များစတင်ခြင်း',
      'ရဲရင့်သောတိုက်ခိုက်မှုများ',
      'အန္တရာယ်ရှိသောကိုယ်ပိုင်းလှုပ်ရှားမှုများ',
      'အမြန်ဆုံးဖြတ်ချက်များချခြင်း',
    ],
    advice: 'Channel energy into exercise. Practice patience. Avoid unnecessary conflicts.',
    adviceMy: 'စွမ်းအင်ကို လေ့ကျင့်ခန်းသို့ပို့ပါ။ ခက်ခဲပါသော်လည်း ဆက်လက်လုပ်ဆောင်ပါ။ မလိုအပ်သောပဋိပက္ခတွေကို ရှောင်ပါ။',
  },
]

function getActiveRetrograde(): RetrogradePeriod | null {
  const now = new Date()
  return retrogradePeriods.find((period) => now >= period.startDate && now <= period.endDate) || null
}

function getNextRetrograde(): RetrogradePeriod | null {
  const now = new Date()
  return retrogradePeriods.find((period) => period.startDate > now) || null
}

export default function RetrogradeAlert() {
  const [activeRetrograde, setActiveRetrograde] = useState<RetrogradePeriod | null>(null)
  const [nextRetrograde, setNextRetrograde] = useState<RetrogradePeriod | null>(null)
  const [showMyanmar, setShowMyanmar] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setActiveRetrograde(getActiveRetrograde())
    setNextRetrograde(getNextRetrograde())
  }, [])

  if (dismissed || (!activeRetrograde && !nextRetrograde)) {
    return null
  }

  const currentRetrograde = activeRetrograde || nextRetrograde
  if (!currentRetrograde) return null

  const isActive = !!activeRetrograde
  const daysUntil = Math.ceil((currentRetrograde.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.ceil((currentRetrograde.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isActive
          ? 'border-amber-500/50 bg-amber-500/10'
          : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`rounded-xl p-2 ${isActive ? 'bg-amber-500/20 text-amber-500' : 'bg-[var(--accent-1)]/15 text-[var(--accent-1)]'}`}>
            {isActive ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                {isActive ? 'Active Retrograde' : 'Upcoming Retrograde'}
              </p>
              <button
                type="button"
                onClick={() => setShowMyanmar(!showMyanmar)}
                className="rounded-full border border-[var(--accent-1)]/20 px-2 py-0.5 text-xs text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/10"
              >
                {showMyanmar ? 'English' : 'မြန်မာ'}
              </button>
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              {showMyanmar ? currentRetrograde.planetMy : currentRetrograde.planet} Retrograde
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {isActive
                ? `${daysRemaining} days remaining (${currentRetrograde.endDate.toLocaleDateString()})`
                : `Starting in ${daysUntil} days (${currentRetrograde.startDate.toLocaleDateString()})`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 text-[var(--text-secondary)] transition hover:bg-[var(--accent-1)]/10 hover:text-[var(--text-primary)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* What to Avoid */}
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
          {showMyanmar ? 'ရှောင်ရှားရန်အရာများ' : 'What to Avoid'}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(showMyanmar ? currentRetrograde.whatToAvoidMy : currentRetrograde.whatToAvoid).map((item, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Advice */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--accent-1)]/5 p-4">
        <CheckCircle className="h-5 w-5 text-[var(--accent-1)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-[var(--accent-1)]">{showMyanmar ? 'အကြံပြုချက်' : 'Advice'}</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {showMyanmar ? currentRetrograde.adviceMy : currentRetrograde.advice}
          </p>
        </div>
      </div>
    </div>
  )
}
