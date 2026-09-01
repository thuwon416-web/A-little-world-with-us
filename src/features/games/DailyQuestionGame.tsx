'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageSquareQuote, Sparkles } from 'lucide-react'

const questions = [
  'What is one tiny thing that made you smile today?',
  'What do you think our next adventure should be?',
  'What part of our relationship feels the strongest right now?',
  'What would make this week feel extra romantic?',
]

export default function DailyQuestionGame() {
  const [selected, setSelected] = useState('')
  const [answer, setAnswer] = useState('')
  const [saved, setSaved] = useState(false)
  const [streak, setStreak] = useState(3)

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const storedAnswer = localStorage.getItem(`daily-question-${todayKey}`)
    const storedStreak = Number(localStorage.getItem('daily-question-streak') || '3')
    const questionIndex = new Date().getDate() % questions.length
    const selectedQuestion = questions[questionIndex] ?? questions[0] ?? ''

    setSelected(selectedQuestion)
    setAnswer(storedAnswer || '')
    setSaved(Boolean(storedAnswer))
    setStreak(Number.isFinite(storedStreak) ? storedStreak : 3)
  }, [])

  const scoreHint = useMemo(() => {
    if (!answer.trim()) return 'Ready when you are.'
    const lower = answer.toLowerCase()
    return lower.includes('us') || lower.includes('we') || lower.includes('love')
      ? 'Beautiful answer — very us.'
      : 'Sweet answer — keep the feeling personal.'
  }, [answer])

  const handleSave = () => {
    const todayKey = new Date().toISOString().slice(0, 10)
    localStorage.setItem(`daily-question-${todayKey}`, answer)
    localStorage.setItem('daily-question-streak', String(streak + 1))
    setSaved(true)
    setStreak((prev) => prev + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <MessageSquareQuote className="w-5 h-5" />
          <h3 className="font-dancing text-2xl">Daily Question</h3>
        </div>
        <span className="text-xs opacity-70">Streak: {streak}</span>
      </div>

      <div className="glass-card p-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 text-[var(--accent-1)]">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs uppercase tracking-[0.2em]">Today’s prompt</span>
        </div>
        <p className="text-sm leading-relaxed">{selected || questions[0]}</p>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={4}
        placeholder="Tell me your answer..."
        className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-3 text-sm outline-none"
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs opacity-70">{scoreHint}</span>
        <button onClick={handleSave} className="glass-button px-3 py-2 text-xs font-medium">
          {saved ? 'Saved' : 'Save answer'}
        </button>
      </div>
    </div>
  )
}
