'use client'

import { Lightbulb, Heart, Sparkles, Shield, Coffee } from 'lucide-react'

interface CareTipsProps {
  selectedDate?: Date | null
}

interface Tip {
  icon: any
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
            titleMy: 'ရေများများသောက်ပါ',
            description: 'Drink plenty of water to help reduce bloating and fatigue during your period.',
            descriptionMy: 'ရာသီလာချိန်အတွင်း ဖောရောင်မှုနှင့် ပင်ပန်းမှုကို လျော့ချရန် ရေများများသောက်ပါ။',
            category: 'self-care',
          },
          {
            icon: Coffee,
            title: 'Gentle Exercise',
            titleMy: 'နူးညံ့တဲ့ လေ့ကျင့်ခန်း',
            description: 'Light walking or yoga can help relieve cramps and improve mood.',
            descriptionMy: 'လမ်းလျှောက်ခြင်း သို့မဟုတ် ယောဂသည် ကိုက်ခဲမှုကို သက်သာစေပြီး စိတ်ကို ကောင်းမွန်စေပါတယ်။',
            category: 'exercise',
          },
          {
            icon: Shield,
            title: 'Rest & Recovery',
            titleMy: 'အနားယူခြင်း',
            description: 'Get extra rest during your period. Your body needs more energy.',
            descriptionMy: 'ရာသီလာချိန်အတွင်း ပိုပြီးအနားယူပါ။ သင့်ခန္ဓာကိုယ်က စွမ်းအင်ပိုလိုအပ်ပါတယ်။',
            category: 'self-care',
          },
        ]
      case 'fertile':
        return [
          {
            icon: Sparkles,
            title: 'Track Your Cycle',
            titleMy: 'သင့်စက်ဝန်းကို ခြေရာခံပါ',
            description: 'Knowing your fertile window helps with family planning and understanding your body.',
            descriptionMy: 'သားဖောက်ချိန်ကို သိခြင်းက မိသားစုစီမံကိန်းနှင့် သင့်ခန္ဓာကိုယ်ကို နားလည်ရန် ကူညီပေးပါတယ်။',
            category: 'health',
          },
          {
            icon: Heart,
            title: 'Self-Care Time',
            titleMy: 'မိမိကိုယ်ကို ဂရုစိုက်ချိန်',
            description: 'Focus on self-care activities that help you feel relaxed and confident.',
            descriptionMy: 'သင့်ကို အနားယူစေပြီး ယုံကြည်မှုရှိစေမယ့် ကိုယ်ကိုယ်ကို ဂရုစိုက်မှုများကို အာရုံစိုက်ပါ။',
            category: 'self-care',
          },
          {
            icon: Lightbulb,
            title: 'Nutrition Focus',
            titleMy: 'အာဟာရအာရုံစိုက်ပါ',
            description: 'Eat foods rich in iron and vitamins to support your body during this phase.',
            descriptionMy: 'ဤအဆင့်အတွင်း သင့်ခန္ဓာကိုယ်ကို ကူညီရန် သံဓာတ်နှင့် ဗီတာမင်ကြွယ်ဝသော အစားအစာများကို စားပါ။',
            category: 'nutrition',
          },
        ]
      default:
        return [
          {
            icon: Lightbulb,
            title: 'Maintain Routine',
            titleMy: 'နေ့စဉ်ပုံမှန်လုပ်ပါ',
            description: 'Keep your regular exercise routine and healthy eating habits.',
            descriptionMy: 'သင့်ပုံမှန်လေ့ကျင့်ခန်းနှင့် ကျန်းမာရေးနှင့်ညီညွတ်သော စားသောက်မှုကို ဆက်လက်ထိန်းသိမ်းပါ။',
            category: 'exercise',
          },
          {
            icon: Heart,
            title: 'Stress Management',
            titleMy: 'စိတ်ဖိအားကို စီမံပါ',
            description: 'Practice relaxation techniques to maintain hormonal balance.',
            descriptionMy: 'ဟော်မုန်းဟန်ချက်ကို ထိန်းသိမ်းရန် အပန်းဖြေနည်းများကို လေ့ကျင့်ပါ။',
            category: 'self-care',
          },
          {
            icon: Coffee,
            title: 'Sleep Well',
            titleMy: 'ကောင်းကောင်းအိပ်ပါ',
            description: 'Aim for 7-8 hours of quality sleep to support your overall health.',
            descriptionMy: 'သင့်ကျန်းမာရေးကို ကူညီရန် အရည်အသွေးရှိသော အိပ်ချိန် ၇-၈ နာရီကို ရည်မှန်းပါ။',
            category: 'self-care',
          },
        ]
    }
  }

  const tips = getTipsForPhase(cyclePhase)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'self-care':
        return 'text-[var(--accent-1)] bg-[var(--accent-1)]/10'
      case 'health':
        return 'text-emerald-500 bg-emerald-500/10'
      case 'nutrition':
        return 'text-[var(--accent-2)] bg-[var(--accent-2)]/10'
      case 'exercise':
        return 'text-blue-500 bg-blue-500/10'
      default:
        return 'text-[var(--accent-1)] bg-[var(--accent-1)]/10'
    }
  }

  const getPhaseLabel = () => {
    switch (cyclePhase) {
      case 'period':
        return 'ရာသီလာချိန် (Period Phase)'
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
