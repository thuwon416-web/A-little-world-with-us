'use client'

import { Lightbulb, Heart, Sparkles, Shield, Coffee } from 'lucide-react'
import { type ComponentType } from 'react'

interface CareTipsProps {
  selectedDate?: Date | null
}

interface Tip {
  icon: React.ComponentType<{ className?: string }>
  title: string
  titleMy: string
  description: string
  descriptionMy: string
  category: 'self-care' | 'health' | 'nutrition' | 'exercise'
}

export default function CareTips({ selectedDate }: CareTipsProps) {
  // Simplified cycle phase detection
  const cycleDay = selectedDate ? selectedDate.getDate() : new Date().getDate()
  const cyclePhase = cycleDay <= 5 ? 'period' : cycleDay >= 10 && cycleDay <= 16 ? 'fertile' : 'normal'

  const getTipsForPhase = (phase: string): Tip[] => {
    switch (phase) {
      case 'period':
        return [
          {
            icon: Heart,
            title: 'Stay Hydrated',
            titleMy: 'ရေအောင်သောင်းသောက်ပါ',
            description: 'Drink plenty of water to help reduce bloating and fatigue during your period.',
            descriptionMy: 'ရာသီလာလအတွင်း ဖောရောင်မှုနှင့် ပင်နိုင်းကို လျော့နည်းစေရန် ရေများသောက်ပါ။',
            category: 'self-care',
          },
          {
            icon: Coffee,
            title: 'Gentle Exercise',
            titleMy: 'နုပ်ပြီးရွေ့လှုပ်ခန်း',
            description: 'Light walking or yoga can help relieve cramps and improve mood.',
            descriptionMy: 'လမ်းလျှောက်သောက်ခြင်း သို့ယောဂသည့်ကိုက်ခဲနှင့် စိတ်အနေအထားကောင်းစေရန် နုပ်ပြီးရွေ့လှုပ်ခန်းပါ။',
            category: 'exercise',
          },
          {
            icon: Shield,
            title: 'Rest & Recovery',
            titleMy: 'အနားယူမှု',
            description: 'Get extra rest during your period. Your body needs more energy.',
            descriptionMy: 'ရာသီလာလအတွင်း ပိုမိအနားယူပါ။ သင့ခန္တာကို ပိုအားလိုသိုပါ။',
            category: 'self-care',
          },
        ]
      case 'fertile':
        return [
          {
            icon: Sparkles,
            title: 'Track Your Cycle',
            titleMy: 'လစဉ်စက်ဝန်းကို စောင့်ကြည့်ပါ',
            description: 'Knowing your fertile window helps with family planning and understanding your body.',
            descriptionMy: 'သားဖောက်ချိန်ကို သိသာသို့စောင့်ကြည့်ပါ။ မိသားလုပ်စီမှုနှင့် ကိုယ်တာကို နားလည်စေပါ။',
            category: 'health',
          },
          {
            icon: Heart,
            title: 'Self-Care Time',
            titleMy: 'မိမိကိုယ်အချိန်',
            description: 'Focus on self-care activities that help you feel relaxed and confident.',
            descriptionMy: 'သင့ခန္တာကို ကျေနပ်ပြီး ကိုယ်ချိန်များကို လုပ်ဆောင်ပါ။',
            category: 'self-care',
          },
          {
            icon: Lightbulb,
            title: 'Nutrition Focus',
            titleMy: 'အစားအသွင်း',
            description: 'Eat foods rich in iron and vitamins to support your body during this phase.',
            descriptionMy: 'ဤရွှောင်းနှင့် ဗီတာမင်များပါသော အစားများကို စားပါ။ သင့ခန္တာကို ပံ့ပိုးပါ။',
            category: 'nutrition',
          },
        ]
      default:
        return [
          {
            icon: Lightbulb,
            title: 'Maintain Routine',
            titleMy: 'နေ့ရက်အစဉ်အလေ့အထများ',
            description: 'Keep your regular exercise routine and healthy eating habits.',
            descriptionMy: 'နေ့ရက်ပုံမှန် ရွေ့လှုပ်ခန်းနှင့ ကျန်းသောအစားစားခြင်းများကို ဆက်ကျင်ထားပါ။',
            category: 'exercise',
          },
          {
            icon: Heart,
            title: 'Stress Management',
            titleMy: 'စိတ်ဖိအားကို လျော့နည်းခြင်း',
            description: 'Practice relaxation techniques to maintain hormonal balance.',
            descriptionMy: 'ဟော်မုန်းများကို လက်တင်ပြီး ဟော်မုန်းချိန်းများကို လျော့နည်းစေပါ။',
            category: 'self-care',
          },
          {
            icon: Coffee,
            title: 'Sleep Well',
            titleMy: 'ကောင်သောင်းစေပါ',
            description: 'Aim for 7-8 hours of quality sleep to support your overall health.',
            descriptionMy: 'ကျန်းသောကျန်းကောင်သောင်းရရန် ညက်နေ့ ၇-၈ နာရီကို ကောင်သောင်းပါ။',
            category: 'self-care',
          },
        ]
    }
  }

  const tips = getTipsForPhase(cyclePhase)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'self-care':
        return 'text-rose-500 bg-rose-500/10'
      case 'health':
        return 'text-emerald-500 bg-emerald-500/10'
      case 'nutrition':
        return 'text-amber-500 bg-amber-500/10'
      case 'exercise':
        return 'text-blue-500 bg-blue-500/10'
      default:
        return 'text-[var(--accent-1)] bg-[var(--accent-1)]/10'
    }
  }

  const getPhaseLabel = () => {
    switch (cyclePhase) {
      case 'period':
        return 'ရာသီလာလက္ခဏာ (Period Phase)'
      case 'fertile':
        return 'သားဖောက်ချိန် (Fertile Phase)'
      default:
        return 'ပုံမှန် (Normal Phase)'
    }
  }

  return (
    <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Personalized Tips</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{getPhaseLabel()}</p>
        </div>
      </div>

      <div className="space-y-3">
        {tips.map((tip, index) => {
          const Icon = tip.icon
          return (
            <div
              key={index}
              className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4 hover:border-[var(--accent-1)]/40 transition"
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2 ${getCategoryColor(tip.category)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">{tip.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">{tip.titleMy}</p>
                  <p className="text-xs text-[var(--text-secondary)]/80">{tip.description}</p>
                  <p className="text-xs text-[var(--text-secondary)]/60 mt-1">{tip.descriptionMy}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Resources */}
      <div className="rounded-2xl border border-[var(--accent-2)]/20 bg-[var(--accent-2)]/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-2)]" />
          <p className="text-xs font-medium text-[var(--text-primary)]">Health Articles</p>
        </div>
        <div className="space-y-2">
          <a href="#" className="block text-xs text-[var(--text-secondary)] hover:text-[var(--accent-2)] transition">
            → Understanding Your Cycle
          </a>
          <a href="#" className="block text-xs text-[var(--text-secondary)] hover:text-[var(--accent-2)] transition">
            → Nutrition for Hormonal Health
          </a>
          <a href="#" className="block text-xs text-[var(--text-secondary)] hover:text-[var(--accent-2)] transition">
            → Exercise and Cycle Regularity
          </a>
        </div>
      </div>
    </div>
  )
}
