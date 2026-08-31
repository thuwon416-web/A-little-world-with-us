'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const QUESTIONS = [
  {
    q: 'What is her favorite color?',
    options: ['Soft Pink', 'Midnight Purple', 'Warm Gold', 'Cream'],
    a: 0,
  },
  {
    q: 'Which song always makes her smile?',
    options: ['Your Song', 'A Love Story', 'Our Melody', 'Unknown'],
    a: 2,
  },
  {
    q: 'Her favorite treat?',
    options: ['Chocolate', 'Strawberries', 'Cheesecake', 'Macarons'],
    a: 3,
  },
]

export default function LoveQuiz() {
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(-1))
  const [submitted, setSubmitted] = useState(false)

  const handleSelect = (qi: number, oi: number) => {
    setAnswers((prev) => {
      const copy = [...prev]
      copy[qi] = oi
      return copy
    })
  }

  const score = answers.reduce((s, a, i) => {
    const question = QUESTIONS[i]
    if (!question) return s
    return s + (a === question.a ? 1 : 0)
  }, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {QUESTIONS.map((q, qi) => (
        <div key={qi} className="p-3 rounded border border-[var(--accent-1)]/10">
          <div className="font-medium text-sm mb-2">{q.q}</div>
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => handleSelect(qi, oi)}
                disabled={submitted}
                className={`px-3 py-1 rounded ${answers[qi] === oi ? 'bg-[var(--accent-1)] text-[var(--text-primary)]' : 'bg-[var(--card-bg)]/60'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button onClick={() => setSubmitted(true)} className="glass-button px-4 py-2">
          See Score
        </button>
      ) : (
        <div className="p-3 bg-[var(--bg-color)] rounded">
          <div className="font-dancing text-xl text-[var(--accent-2)]">
            Your Love Quiz Score: {score}/{QUESTIONS.length}
          </div>
          <div className="text-sm opacity-70 mt-2">
            {score === QUESTIONS.length
              ? 'Perfect! You know her so well ❤️'
              : 'Nice try — keep learning the little things.'}
          </div>
        </div>
      )}
    </motion.div>
  )
}
