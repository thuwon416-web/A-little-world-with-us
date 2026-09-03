'use client'

import { useState } from 'react'
import { Sparkles, Heart, Briefcase, Activity, DollarSign } from 'lucide-react'

interface HoroscopeData {
  love: string
  loveMy: string
  career: string
  careerMy: string
  health: string
  healthMy: string
  money: string
  moneyMy: string
}

const horoscopes: Record<string, HoroscopeData> = {
  Aries: {
    love: 'Your passion is high today. Express your feelings openly to strengthen your bond.',
    loveMy: 'ယနေ့ ချစ်စရာစိတ်မြင့်တက်ပါ။ ချစ်စရာစိတ်ကို ဖော်ပြပါ။',
    career: 'Take initiative on new projects. Your leadership skills shine today.',
    careerMy: 'ပရောဂျီအသစ်များကို ဦးဆောင်ပါ။ ခေါင်းဆောင်မှုစွမ်းရည်မြင့်မားပါ။',
    health: 'Good energy for exercise. Try a new workout routine.',
    healthMy: 'လေ့ကျင့်ခန်းအတွက် စွမ်းအင်ကောင်းပါ။ လေ့ကျင့်ခန်းအသစ်ကို စမ်းကြည့်ပါ။',
    money: 'Financial gains possible. Focus on long-term investments.',
    moneyMy: 'ငွေကြေးရရှိနိုင်ပါ။ ရှည်ပြီးရင်းနှီးမြှုပ်နှံမှုကို အဓိကထားပါ။',
  },
  Taurus: {
    love: 'Stability in relationships. Quality time together strengthens your connection.',
    loveMy: 'ဆက်ဆံရေးမြဲမြံပါ။ အချိန်ကောင်းတွေ အတူနေပါ။',
    career: 'Patience pays off. Stick to your current tasks for best results.',
    careerMy: 'ခက်ခဲပါသော်လည်း ဆက်လက်လုပ်ဆောင်ပါ။ ရလဒ်ကောင်းရမည်။',
    health: 'Focus on nutrition. Cook healthy meals at home.',
    healthMy: 'အာဟာရကို အဓိကထားပါ။ ကျန်းမာရေးကောင်းစားကို အိမ်မှာချက်ပါ။',
    money: 'Conservative approach to spending works well today.',
    moneyMy: 'ငွေသုံးစွဲမှုကို သိမ်းသိမ်းသွားပါ။',
  },
  Gemini: {
    love: 'Communication is key. Have deep conversations with your partner.',
    loveMy: 'ဆက်သွယ်ရေးအရေးကြီးပါ။ အတွင်းစကားပြောပါ။',
    career: 'Networking brings opportunities. Connect with colleagues.',
    careerMy: 'ဆက်သွယ်ရေးမှ အခွင့်အလမ်းရရှိပါ။',
    health: 'Mental clarity is high. Good day for learning new skills.',
    healthMy: 'စိတ်ကြည်လင်ပါ။ ကျွမ်းကျင်မှုအသစ်တွေ လေ့လာပါ။',
    money: 'Multiple income streams possible. Stay organized.',
    moneyMy: 'ဝင်ငွေများဖြစ်နိုင်ပါ။ စနစ်တကျနေပါ။',
  },
  Cancer: {
    love: 'Emotional bonds deepen. Share your feelings honestly.',
    loveMy: 'စိတ်ခံစားမှုများ နက်ရှိုင်းပါ။ စိတ်ခံစားချက်ကို ဖော်ပြပါ။',
    career: 'Trust your intuition. Creative solutions come naturally.',
    careerMy: 'စိတ်ဆိုးစိတ်ကို ယုံကြည်ပါ။ ဖန်တီးမှုကောင်းတွေရပါ။',
    health: 'Self-care is important. Take time to relax and recharge.',
    healthMy: 'ကိုယ်ပိုင်စောင့်ရှောက်မှုအရေးကြီးပါ။ အနားယူပါ။',
    money: 'Home-related investments favorable. Consider renovations.',
    moneyMy: 'အိမ်ဆိုင်ရာရင်းနှီးမြှုပ်နှံမှုကောင်းပါ။',
  },
  Leo: {
    love: 'Romance is in the air. Plan a special date night.',
    loveMy: 'ချစ်စရာစိတ်ပြည့်နေပါ။ အထူးရက်သတ္တပတ်ကို စီစဉ်ပါ။',
    career: 'Recognition comes your way. Your hard work is noticed.',
    careerMy: 'ချီးမြှောက်မှုရရှိပါ။ အလုပ်မှန်ကန်စွာလုပ်ပါ။',
    health: 'High energy levels. Perfect for sports and physical activities.',
    healthMy: 'စွမ်းအင်မြင့်မားပါ။ ကစားနည်းတွေကို လုပ်ပါ။',
    money: 'Generous spending but keep some savings aside.',
    moneyMy: 'ငွေသုံးလိုသော်လည်း သိမ်းဆည်းပါ။',
  },
  Virgo: {
    love: 'Small gestures matter. Show appreciation to your partner.',
    loveMy: 'သေးသေးတိုးတိုးမှုတွေအရေးကြီးပါ။ ကျေးဇူးတင်ပါ။',
    career: 'Attention to detail leads to success. Double-check your work.',
    careerMy: 'အသေးစိတ်စိစစ်ပါ။ အလုပ်ကို နှစ်ကြိမ်စစ်ဆေးပါ။',
    health: 'Establish healthy routines. Sleep and hydration are key.',
    healthMy: 'ကျန်းမာရေးနိုင်ငံကို စတည်းပါ။ အိပ်ရေးအရေးကြီးပါ။',
    money: 'Budgeting helps. Track your expenses carefully.',
    moneyMy: 'ဘတ်ဂျက်ကို စီမံပါ။ ငွေသုံးစွဲမှုကို စောင့်ကြည့်ပါ။',
  },
  Libra: {
    love: 'Harmony and balance. Compromise strengthens your relationship.',
    loveMy: 'ညီညွတ်မှုနှင့် မျှတမှုရှိပါ။ ညှိနှိုင်းပါ။',
    career: 'Collaboration brings success. Work well with your team.',
    careerMy: 'ပူးပေါင်းဆောင်ရွက်မှုမှ အောင်မြင်မှုရပါ။',
    health: 'Balance is key. Mix work with relaxation.',
    healthMy: 'မျှတမှုအရေးကြီးပါ။ အလုပ်နှင့် အနားယူမှုကို ရောနှောပါ။',
    money: 'Fair dealings in finance. Avoid risky investments.',
    moneyMy: 'ငွေကြေးကိစ္စတွင် တရားမျှတပါ။ အန္တရာယ်ရှိသောရင်းနှီးမြှုပ်နှံမှုကို ရှောင်ပါ။',
  },
  Scorpio: {
    love: 'Intensity and passion. Deepen your emotional connection.',
    loveMy: 'စိတ်ခံစားမှုမြင့်မားပါ။ စိတ်ဆက်သွယ်မှုကို နက်ရှိုင်းစေပါ။',
    career: 'Focus on long-term goals. Strategic thinking pays off.',
    careerMy: 'ရှည်ပြီးရင်းနှီးမြှုပ်နှံမှုကို အဓိကထားပါ။',
    health: 'Detox and cleanse. Remove unhealthy habits.',
    healthMy: 'ကျန်းမာရေးသန့်စင်ပါ။ မကောင်းတဲ့အလေ့အကျင့်တွေကို ဖယ်ရှားပါ။',
    money: 'Transformation in finances. Clear debts if possible.',
    moneyMy: 'ငွေကြေးပြောင်းလဲမှုရှိပါ။ ကြွေးမြီတွေကို ရှင်းပါ။',
  },
  Sagittarius: {
    love: 'Adventure and excitement. Try new experiences together.',
    loveMy: 'စွန့်စားမှုနှင့် စိတ်လှုပ်ရှားမှုရှိပါ။ အတွေ့အကြုံအသစ်တွေကို စမ်းကြည့်ပါ။',
    career: 'Expansion opportunities. Consider new projects or partnerships.',
    careerMy: 'ချဲ့ထွင်မှုအခွင့်အလမ်းရှိပါ။ ပရောဂျီအသစ်တွေကို စဉ်းစားပါ။',
    health: 'Outdoor activities benefit you. Go for a hike or run.',
    healthMy: 'ပြင်ပလှုပ်ရှားမှုတွေက ကောင်းပါ။ လမ်းလျှောက်ပါ။',
    money: 'Travel and education expenses. Worth the investment.',
    moneyMy: 'ခရီးသွားနှင့် ပညာရေးကုန်ကျစရိတ်ရှိပါ။ တန်ဖိုးရှိပါ။',
  },
  Capricorn: {
    love: 'Commitment deepens. Build trust through consistency.',
    loveMy: 'ကတိစောင့်ထိန်းမှုမြင့်မားပါ။ ယုံကြည်မှုကို တည်ဆောက်ပါ။',
    career: 'Professional growth. Your dedication is recognized.',
    careerMy: 'အလုပ်ဖွံ့ဖြိုးမှုရှိပါ။ ကြိုးစားမှုကို ချီးမြှောက်ပါ။',
    health: 'Structure your routine. Consistency brings results.',
    healthMy: 'နေ့စဉ်လုပ်ဆောင်ချက်ကို စနစ်တကျဖန်တီးပါ။',
    money: 'Long-term financial planning. Save for the future.',
    moneyMy: 'ရှည်ပြီးငွေကြေးစီမံကိန်းကို စီစဉ်ပါ။ အနာဂတ်အတွက် သိမ်းဆည်းပါ။',
  },
  Aquarius: {
    love: 'Friendship and romance. Your partner is also your best friend.',
    loveMy: 'မိတ်ဆွေမှုနှင့် ချစ်စရာစိတ်ရှိပါ။ မိတ်ဆွေကောင်းပါ။',
    career: 'Innovation pays off. Think outside the box.',
    careerMy: 'တီထွင်မှုမှ အောင်မြင်မှုရပါ။ တွေးခေါ်မှုအသစ်ပါ။',
    health: 'Mental wellness focus. Meditation or yoga benefits you.',
    healthMy: 'စိတ်ကျန်းမာရေးကို အဓိကထားပါ။ ကြိုးစားခန်းလုပ်ပါ။',
    money: 'Tech investments favorable. Stay updated on trends.',
    moneyMy: 'နည်းပညာရင်းနှီးမြှုပ်နှံမှုကောင်းပါ။ လှုပ်ရှားမှုတွေကို စောင့်ကြည့်ပါ။',
  },
  Pisces: {
    love: 'Dreamy and romantic. Follow your heart.',
    loveMy: 'အိပ်မက်နှင့် ချစ်စရာစိတ်ရှိပါ။ စိတ်ကို လိုက်လံပါ။',
    career: 'Creative projects flourish. Trust your artistic instincts.',
    careerMy: 'ဖန်တီးမှုပရောဂျီတွေ ဖွံ့ဖြိုးပါ။ အနုပည်စိတ်ကို ယုံကြည်ပါ။',
    health: 'Listen to your body. Rest when needed.',
    healthMy: 'ခန္တာကိုယ်စကားကို နားထောင်ပါ။ လိုသောအခါ အနားယူပါ။',
    money: 'Intuitive financial decisions. Trust your gut feeling.',
    moneyMy: 'စိတ်ဆိုးစိတ်နှင့် ငွေကြေးဆုံးဖြတ်ချက်ချပါ။',
  },
}

export default function DailyHoroscope() {
  const [selectedSign, setSelectedSign] = useState('Leo')
  const [showMyanmar, setShowMyanmar] = useState(false)

  const currentHoroscope = horoscopes[selectedSign]

  const categories = [
    { key: 'love' as const, icon: Heart, label: 'Love', labelMy: 'အိမ်ထောင်ရေး' },
    { key: 'career' as const, icon: Briefcase, label: 'Career', labelMy: 'အလုပ်ကိစ္စ' },
    { key: 'health' as const, icon: Activity, label: 'Health', labelMy: 'ကျန်းမာရေး' },
    { key: 'money' as const, icon: DollarSign, label: 'Money', labelMy: 'ငွေကြေး' },
  ]

  return (
    <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Daily Horoscope</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">မနေ့မနက် နတ်မျက်နှာ</p>
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

      {/* Sign Selection */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        {Object.keys(horoscopes).map((sign) => (
          <button
            key={sign}
            type="button"
            onClick={() => setSelectedSign(sign)}
            className={`rounded-lg border px-3 py-2 text-center text-sm transition ${
              selectedSign === sign
                ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] hover:border-[var(--accent-1)]/40'
            }`}
          >
            {sign}
          </button>
        ))}
      </div>

      {/* Horoscope Content */}
      <div className="space-y-3">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <div
              key={category.key}
              className="flex items-start gap-3 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4"
            >
              <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  {showMyanmar ? category.labelMy : category.label}
                </p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">
                  {showMyanmar ? currentHoroscope[`${category.key}My` as keyof HoroscopeData] : currentHoroscope[category.key]}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
