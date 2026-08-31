'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, Sparkles } from 'lucide-react'

const adviceLibrary = [
  'Lean into the little rituals—coffee, hand squeezes, and quiet check-ins are where closeness grows.',
  'A warm, honest conversation is the fastest way to melt distance. Ask what feels good and what feels heavy today.',
  'Plan one playful moment this week: a surprise snack, a short walk, or a silly game at home.',
  'You are already doing the important part: showing up with gentleness and attention.',
]

export default function AILoveCoach() {
  const [vibe, setVibe] = useState('romantic')
  const [idea, setIdea] = useState(adviceLibrary[0])

  const tips = useMemo(() => {
    if (vibe === 'romantic') {
      return [
        'Write a note that starts with “I love how you…”',
        'Create a mini “date night” at home with your favorite snacks',
        'Ask one deeper question and really listen without rushing to fix it',
      ]
    }
    if (vibe === 'calm') {
      return [
        'Try a slower evening with no phones for 20 minutes',
        'Share a quiet check-in and let the day breathe',
        'Choose comfort over productivity tonight',
      ]
    }
    return [
      'Turn tension into teamwork with a light reset conversation',
      'Pick one fun micro-adventure for the weekend',
      'Celebrate progress, even if the day was messy',
    ]
  }, [vibe])

  const generateAdvice = () => {
    const index = Math.floor(Math.random() * adviceLibrary.length)
    setIdea(adviceLibrary[index])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <BrainCircuit className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">AI Love Coach</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {['romantic', 'calm', 'repair'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setVibe(option)}
            className={`rounded-full px-3 py-2 text-[11px] capitalize ${
              vibe === option
                ? 'bg-[var(--accent-1)] text-[var(--text-primary)] shadow-md'
                : 'bg-[var(--card-bg)]/35 text-[var(--text-primary)]'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <motion.div layout className="glass-card rounded-2xl p-3">
        <div className="flex items-center gap-2 text-[var(--accent-1)] mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs uppercase tracking-[0.2em]">Guidance</span>
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-primary)]/80">{idea}</p>
      </motion.div>

      <div className="space-y-2">
        {tips.map((tip) => (
          <div key={tip} className="rounded-xl bg-[var(--card-bg)] px-3 py-2 text-sm">
            {tip}
          </div>
        ))}
      </div>

      <button onClick={generateAdvice} className="glass-button w-full text-sm">
        Generate fresh guidance
      </button>
    </div>
  )
}
