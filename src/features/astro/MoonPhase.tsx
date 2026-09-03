'use client'

import { useState, useEffect } from 'react'
import { Moon, Heart } from 'lucide-react'

interface MoonPhaseData {
  phase: string
  phaseMy: string
  emoji: string
  illumination: number
  description: string
  descriptionMy: string
  relationshipImpact: string
  relationshipImpactMy: string
}

const moonPhases: MoonPhaseData[] = [
  {
    phase: 'New Moon',
    phaseMy: 'လမွေး',
    emoji: '🌑',
    illumination: 0,
    description: 'Time for new beginnings and setting intentions.',
    descriptionMy: 'အစသစ်စွာစတင်ရန်နှင့် ရည်မှန်းချက်ချရန်အချိန်။',
    relationshipImpact: 'Perfect for starting new relationship goals together.',
    relationshipImpactMy: 'ဆက်ဆံရေးရည်မှန်းချက်အသစ်တွေကို အတူစတင်ရန် အကောင်းဆုံးအချိန်။',
  },
  {
    phase: 'Waxing Crescent',
    phaseMy: 'လရွေး',
    emoji: '🌒',
    illumination: 25,
    description: 'Growing energy. Take action on your intentions.',
    descriptionMy: 'စွမ်းအင်တိုးတက်နေပါ။ ရည်မှန်းချက်တွေကို အကောင်အထည်ဖော်ပါ။',
    relationshipImpact: 'Good time for planning romantic activities.',
    relationshipImpactMy: 'ချစ်စရာစိတ်လှုပ်ရှားမှုတွေကို စီစဉ်ရန်အချိန်ကောင်းပါ။',
  },
  {
    phase: 'First Quarter',
    phaseMy: 'လပြည့်ဝမတ်',
    emoji: '🌓',
    illumination: 50,
    description: 'Take decisive action. Overcome challenges.',
    descriptionMy: 'ဆုံးဖြတ်ချက်ချပါ။ စိန်ခေါ်မှုတွေကို အောင်နိုင်ပါ။',
    relationshipImpact: 'Address any relationship issues directly.',
    relationshipImpactMy: 'ဆက်ဆံရေးပြဿနာတွေကို တိုက်ရိုက်ဖြေရှင်းပါ။',
  },
  {
    phase: 'Waxing Gibbous',
    phaseMy: 'လပြည့်မတ်',
    emoji: '🌔',
    illumination: 75,
    description: 'Refine and adjust. Fine-tune your plans.',
    descriptionMy: 'ပြုပြင်ပြင်ဆင်ပါ။ စီမံကိန်းတွေကို ချိန်ညှိပါ။',
    relationshipImpact: 'Deepen emotional connections.',
    relationshipImpactMy: 'စိတ်ခံစားမှုဆက်သွယ်မှုကို နက်ရှိုင်းစေပါ။',
  },
  {
    phase: 'Full Moon',
    phaseMy: 'လပြည့်',
    emoji: '🌕',
    illumination: 100,
    description: 'Peak energy. Emotions are heightened.',
    descriptionMy: 'စွမ်းအင်အမြင့်စား။ စိတ်ခံစားမှုမြင့်မားပါ။',
    relationshipImpact: 'Express love openly. Celebrate your bond.',
    relationshipImpactMy: 'ချစ်စရာစိတ်ကို ဖော်ပြပါ။ ဆက်ဆံရေးကို ဂုဏ်ပြုပါ။',
  },
  {
    phase: 'Waning Gibbous',
    phaseMy: 'လလွန်',
    emoji: '🌖',
    illumination: 75,
    description: 'Share wisdom. Teach and learn together.',
    descriptionMy: 'အတွေးအခေါ်များမျှဝေပါ။ အတူသင်ယူပါ။',
    relationshipImpact: 'Reflect on relationship growth.',
    relationshipImpactMy: 'ဆက်ဆံရေးဖွံ့ဖြိုးမှုကို ပြန်စဉ်းစားပါ။',
  },
  {
    phase: 'Last Quarter',
    phaseMy: 'လကွမ်း',
    emoji: '🌗',
    illumination: 50,
    description: 'Release and let go. Clear out what no longer serves.',
    descriptionMy: 'လွှတ်လိုက်ပါ။ မလိုအပ်တဲ့အရာတွေကို ရှင်းလင်းပါ။',
    relationshipImpact: 'Forgive and move forward together.',
    relationshipImpactMy: 'လွတ်လပ်စွာခွင့်လွှတ်ပြီး အတူရှေ့ဆက်သွားပါ။',
  },
  {
    phase: 'Waning Crescent',
    phaseMy: 'လကွမ်းရွေး',
    emoji: '🌘',
    illumination: 25,
    description: 'Rest and reflect. Prepare for new cycle.',
    descriptionMy: 'အနားယူပြီး ပြန်စဉ်းစားပါ။ ခါလတ်အသစ်အတွက် ပြင်ဆင်ပါ။',
    relationshipImpact: 'Nurture intimacy and quiet moments.',
    relationshipImpactMy: 'နီးကပ်မှုနှင့် တိတ်ဆိတ်သောအချိန်တွေကို ပြုစုပါ။',
  },
]

// Calculate current moon phase based on date
function getCurrentMoonPhase(): MoonPhaseData {
  const now = new Date()
  const dayOfMonth = now.getDate()
  const phaseIndex = Math.floor((dayOfMonth % 29.5) / 3.7)
  return moonPhases[phaseIndex % moonPhases.length]
}

export default function MoonPhase() {
  const [currentPhase, setCurrentPhase] = useState<MoonPhaseData>(getCurrentMoonPhase())
  const [showMyanmar, setShowMyanmar] = useState(false)

  useEffect(() => {
    setCurrentPhase(getCurrentMoonPhase())
  }, [])

  return (
    <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Moon Phase</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">လညွှန်း</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMyanmar(!showMyanmar)}
          className="rounded-full border border-[var(--accent-1)]/20 px-3 py-1 text-xs text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/10"
        >
          {showMyanmar ? 'English' : 'မြန်မာ'}
        </button>
      </div>

      {/* Current Moon Phase Display */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
        <div className="text-6xl">{currentPhase.emoji}</div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            {showMyanmar ? currentPhase.phaseMy : currentPhase.phase}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {currentPhase.illumination}% Illumination
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
        <p className="text-sm text-[var(--text-primary)]">
          {showMyanmar ? currentPhase.descriptionMy : currentPhase.description}
        </p>
      </div>

      {/* Relationship Impact */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--accent-1)]/5 p-4">
        <Heart className="h-5 w-5 text-[var(--accent-1)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-[var(--accent-1)]">Relationship Impact</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {showMyanmar ? currentPhase.relationshipImpactMy : currentPhase.relationshipImpact}
          </p>
        </div>
      </div>

      {/* All Moon Phases */}
      <div className="mt-6">
        <p className="mb-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-[0.2em]">
          All Phases
        </p>
        <div className="grid grid-cols-4 gap-2">
          {moonPhases.map((phase) => (
            <button
              key={phase.phase}
              type="button"
              onClick={() => setCurrentPhase(phase)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                currentPhase.phase === phase.phase
                  ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10'
                  : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/40'
              }`}
            >
              <span className="text-2xl">{phase.emoji}</span>
              <span className="text-xs text-[var(--text-primary)]">
                {showMyanmar ? phase.phaseMy : phase.phase}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
