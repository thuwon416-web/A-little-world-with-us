'use client'

import { useState } from 'react'
import { Heart, Star, Calendar, Sparkles } from 'lucide-react'

// Zodiac signs for Western astrology
const _zodiacSigns = [
  { name: 'Aries', nameMy: 'မိဿင်း', date: 'Mar 21 - Apr 19' },
  { name: 'Taurus', nameMy: 'ပြိဿင်း', date: 'Apr 20 - May 20' },
  { name: 'Gemini', nameMy: 'သိဟ်င်း', date: 'May 21 - Jun 20' },
  { name: 'Cancer', nameMy: 'ကရကဋင်း', date: 'Jun 21 - Jul 22' },
  { name: 'Leo', nameMy: 'သိင်္ခင်း', date: 'Jul 23 - Aug 22' },
  { name: 'Virgo', nameMy: 'ကန္တာင်း', date: 'Aug 23 - Sep 22' },
  { name: 'Libra', nameMy: 'တူင်း', date: 'Sep 23 - Oct 22' },
  { name: 'Scorpio', nameMy: 'ဝိစ္ဆိကင်း', date: 'Oct 23 - Nov 21' },
  { name: 'Sagittarius', nameMy: 'ဓနုင်း', date: 'Nov 22 - Dec 21' },
  { name: 'Capricorn', nameMy: 'မကာင်း', date: 'Dec 22 - Jan 19' },
  { name: 'Aquarius', nameMy: 'ကုမ္ဘင်း', date: 'Jan 20 - Feb 18' },
  { name: 'Pisces', nameMy: 'မိနင်း', date: 'Feb 19 - Mar 20' },
]

// Nakshatras for Vedic astrology
const _nakshatras = [
  { name: 'Ashwini', nameMy: 'အဿဝဏီ' },
  { name: 'Bharani', nameMy: 'ဘာရဏီ' },
  { name: 'Krittika', nameMy: 'ကြိတ္တိက' },
  { name: 'Rohini', nameMy: 'ရောဟိဏီ' },
  { name: 'Mrigashira', nameMy: 'မြိဂသီရ' },
  { name: 'Ardra', nameMy: 'အာဒြ' },
  { name: 'Punarvasu', nameMy: 'ပုနရဝသု' },
  { name: 'Pushya', nameMy: 'ပုဿ' },
  { name: 'Ashlesha', nameMy: 'အာသလှ' },
  { name: 'Magha', nameMy: 'မာဃ' },
  { name: 'Purva Phalguni', nameMy: 'ပူရဖလ္ဂုဏီ' },
  { name: 'Uttara Phalguni', nameMy: 'ဥတ္တရဖလ္ဂုဏီ' },
  { name: 'Hasta', nameMy: 'ဟဿ' },
  { name: 'Chitra', nameMy: 'စိတြ' },
  { name: 'Swati', nameMy: 'သွာတိ' },
  { name: 'Vishakha', nameMy: 'ဝိသာခ' },
  { name: 'Anuradha', nameMy: 'အနုရာဓ' },
  { name: 'Jyeshtha', nameMy: 'ဇေဋ္ဌ' },
  { name: 'Mula', nameMy: 'မူလ' },
  { name: 'Purva Ashadha', nameMy: 'ပူရာသာဓ' },
  { name: 'Uttara Ashadha', nameMy: 'ဥတ္တရာသာဓ' },
  { name: 'Shravana', nameMy: 'သရဝဏ' },
  { name: 'Dhanishta', nameMy: 'ဓနိသ္တ' },
  { name: 'Shatabhisha', nameMy: 'သတဘိသ' },
  { name: 'Purva Bhadrapada', nameMy: 'ပူရဘာဒြပါဒ' },
  { name: 'Uttara Bhadrapada', nameMy: 'ဥတ္တရဘာဒြပါဒ' },
  { name: 'Revati', nameMy: 'ရေဝတိ' },
]

// Chinese zodiac animals
const _chineseZodiac = [
  { name: 'Rat', nameMy: 'ကြွက်' },
  { name: 'Ox', nameMy: 'နွား' },
  { name: 'Tiger', nameMy: 'ကျား' },
  { name: 'Rabbit', nameMy: 'ယုန်' },
  { name: 'Dragon', nameMy: 'နဂါး' },
  { name: 'Snake', nameMy: 'မြွေ' },
  { name: 'Horse', nameMy: 'မြင်း' },
  { name: 'Goat', nameMy: 'ဆိတ်' },
  { name: 'Monkey', nameMy: 'မျောက်' },
  { name: 'Rooster', nameMy: 'ကြက်' },
  { name: 'Dog', nameMy: 'ခွေး' },
  { name: 'Pig', nameMy: 'ဝက်' },
]

// Myanmar Thadinne (37 Nats)
const _thadinne = [
  { name: 'Mahagiri', nameMy: 'မဟာဂိရိ' },
  { name: 'Hnamadawgyi', nameMy: 'နားမတော်ကြီး' },
  { name: 'Shwenawrah', nameMy: 'ရွှေနတ်ရွာ' },
  { name: 'Thandawgan', nameMy: 'သန်တော်ကြီး' },
  { name: 'Maung Min', nameMy: 'မောင်မင်း' },
  { name: 'Shindaw', nameMy: 'ရှင်နတ်တော်' },
  { name: 'Minye Aungdin', nameMy: 'မင်းရဲအောင်ထင်' },
  { name: 'Tabinshwehti', nameMy: 'တပင်ရွှေထီး' },
  { name: 'Bayinnaung', nameMy: 'ဘုရင့်နောင်' },
  { name: 'Anaukphetlu', nameMy: 'အနောက်ဖက်လူ' },
  { name: 'Minye Kyawhtin', nameMy: 'မင်းရဲကျော်ထင်' },
  { name: 'Shwe Nawrahta', nameMy: 'ရွှေနော်ရထာ' },
  { name: 'Minkhaung', nameMy: 'မင်းခေါင်' },
  { name: 'Alaungpaya', nameMy: 'အလောင်းဘုရား' },
  { name: 'Shwebo Min', nameMy: 'ရွှေဘိုမင်း' },
  { name: 'Maha Bandula', nameMy: 'မဟာဗန္ဓုလ' },
  { name: 'Kyan Sittha', nameMy: 'ကျန်စစ်သား' },
  { name: 'Anawrahta', nameMy: 'အနော်ရထာ' },
  { name: 'Narapati', nameMy: 'နရပတိ' },
  { name: 'Sithu', nameMy: 'စော်ဘွား' },
  { name: 'Kyansittha', nameMy: 'ကျန်စစ်သား' },
  { name: 'Min Kyawzwa', nameMy: 'မင်းကျော်ဇွာ' },
  { name: 'Myat Paya', nameMy: 'မြတ်ဘုရား' },
  { name: 'Min Hla Kyaw', nameMy: 'မင်းလှကျော်' },
  { name: 'Min Ye Thiha', nameMy: 'မင်းရဲသီဟ' },
  { name: 'Min Ra Zar', nameMy: 'မင်းရာဇာ' },
  { name: 'Min Gyee', nameMy: 'မင်းဂျီ' },
  { name: 'Min Nge', nameMy: 'မင်းငယ်' },
  { name: 'Min Thiha', nameMy: 'မင်းသီဟ' },
  { name: 'Min Kyaw', nameMy: 'မင်းကျော်' },
  { name: 'Min Saw', nameMy: 'မင်းစော' },
  { name: 'Min Phyu', nameMy: 'မင်းဖြူ' },
  { name: 'Min Khaung', nameMy: 'မင်းခေါင်' },
  { name: 'Min Letya', nameMy: 'မင်းလက်ျာ' },
  { name: 'Min Bya', nameMy: 'မင်းပြာ' },
  { name: 'Min Naung', nameMy: 'မင်းနောင်' },
  { name: 'Min Thway', nameMy: 'မင်းသွေး' },
]

export default function CompatibilityScore() {
  const [selectedMethod, setSelectedMethod] = useState<'western' | 'vedic' | 'chinese' | 'myanmar'>('western')

  // Simplified compatibility calculation
  const calculateScore = (method: string): number => {
    // In production, this would use actual birth dates and complex algorithms
    const scores = {
      western: 85,
      vedic: 78,
      chinese: 92,
      myanmar: 88,
    }
    return scores[method as keyof typeof scores] || 75
  }

  const methods = [
    { id: 'western', name: 'Western', nameMy: 'အနောက်တိုင်း', icon: Star, description: 'Zodiac signs' },
    { id: 'vedic', name: 'Vedic', nameMy: 'ဗေဒင်', icon: Calendar, description: 'Nakshatra' },
    { id: 'chinese', name: 'Chinese', nameMy: 'တရုတ်', icon: Sparkles, description: '12 animals' },
    { id: 'myanmar', name: 'Myanmar', nameMy: 'မြန်မာ', icon: Heart, description: 'Thadinne' },
  ]

  const overallScore = Math.round(
    (calculateScore('western') + calculateScore('vedic') + calculateScore('chinese') + calculateScore('myanmar')) / 4
  )

  return (
    <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Compatibility</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">ချစ်ကြိုက်မှုတွက်နည်း</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[var(--accent-1)]">{overallScore}%</p>
          <p className="text-xs text-[var(--text-secondary)]">Overall</p>
        </div>
      </div>

      {/* Method Selection */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        {methods.map((method) => {
          const Icon = method.icon
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id as 'western' | 'vedic' | 'chinese' | 'myanmar')}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                selectedMethod === method.id
                  ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10'
                  : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/40'
              }`}
            >
              <Icon className="h-4 w-4 text-[var(--accent-1)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{method.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{method.nameMy}</p>
              </div>
              <p className="text-sm font-bold text-[var(--accent-1)]">{calculateScore(method.id)}%</p>
            </button>
          )
        })}
      </div>

      {/* Selected Method Details */}
      <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-[var(--text-primary)]">
            {methods.find((m) => m.id === selectedMethod)?.name} Astrology
          </h3>
          <span className="text-xs text-[var(--text-secondary)]">
            {methods.find((m) => m.id === selectedMethod)?.description}
          </span>
        </div>

        {selectedMethod === 'western' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Based on zodiac sign compatibility. Your signs complement each other with strong romantic chemistry.
            </p>
            <div className="flex gap-2">
              <span className="rounded-full bg-[var(--accent-1)]/10 px-3 py-1 text-xs text-[var(--accent-1)]">
                Leo & Libra
              </span>
              <span className="rounded-full bg-[var(--accent-1)]/10 px-3 py-1 text-xs text-[var(--accent-1)]">
                Fire & Air
              </span>
            </div>
          </div>
        )}

        {selectedMethod === 'vedic' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Based on Nakshatra (lunar mansion) compatibility. Your stars align harmoniously for long-term partnership.
            </p>
            <div className="flex gap-2">
              <span className="rounded-full bg-[var(--accent-1)]/10 px-3 py-1 text-xs text-[var(--accent-1)]">
                Magha & Purva Phalguni
              </span>
            </div>
          </div>
        )}

        {selectedMethod === 'chinese' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Based on Chinese zodiac animals. Your animal signs create excellent harmony and mutual understanding.
            </p>
            <div className="flex gap-2">
              <span className="rounded-full bg-[var(--accent-1)]/10 px-3 py-1 text-xs text-[var(--accent-1)]">
                Dragon & Monkey
              </span>
            </div>
          </div>
        )}

        {selectedMethod === 'myanmar' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Based on Myanmar Thadinne (37 Nats). Your birth nats are auspiciously matched for a blessed union.
            </p>
            <div className="flex gap-2">
              <span className="rounded-full bg-[var(--accent-1)]/10 px-3 py-1 text-xs text-[var(--accent-1)]">
                Mahagiri & Shwenawrah
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
