'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Trophy } from 'lucide-react'
import { KOREAN_VOCAB } from '@/data/korean-vocab'
import { upsertProgress } from '@/services/korean'
import { supabase } from '@/lib/supabase'
import type { KoreanLevel, KoreanProgress, KoreanVocab, QuizType } from '@/types/korean'
import { QuizQuestion, type QuizPrompt } from './QuizQuestion'

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

function makePrompt(vocab: KoreanVocab, type: QuizType, pool: KoreanVocab[]): QuizPrompt {
  const answer = type === 'typing' ? vocab.korean : vocab.english
  const distractors = shuffle(pool.filter((item) => item.id !== vocab.id)).slice(0, 3).map((item) => item.english)
  const options = shuffle([answer, ...distractors])
  const prompt =
    type === 'listening'
      ? `Which meaning matches this Korean word? (${vocab.romanization})`
      : type === 'typing'
        ? `Type the Korean word for "${vocab.english}".`
        : `What does "${vocab.korean}" mean?`
  return { vocab, questionType: type, options, prompt }
}

const reviewDelayDays = (mastery: KoreanProgress['masteryLevel']) =>
  mastery <= 1 ? 1 : mastery <= 3 ? 3 : mastery === 4 ? 7 : 30

export function QuizEngine({
  level,
  quizType,
  questionCount,
  onComplete,
}: {
  level: KoreanLevel
  quizType: QuizType
  questionCount: number
  onComplete: (score: number) => void
}) {
  const questions = useMemo(
    () => shuffle(KOREAN_VOCAB.filter((item) => item.level === level)).slice(0, questionCount).map((item) => makePrompt(item, quizType, KOREAN_VOCAB.filter((vocab) => vocab.level === level))),
    [level, quizType, questionCount]
  )
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [checking, setChecking] = useState(false)
  const [complete, setComplete] = useState(false)

  if (questions.length === 0) return <p className="text-sm text-text-2">No vocabulary is available for this level yet.</p>
  if (complete) {
    const percent = Math.round((score / questions.length) * 100)
    return (
      <div className="space-y-4 text-center">
        <Trophy className="mx-auto text-accent-1" size={42} />
        <h3 className="text-2xl font-bold text-text-1">Quiz complete</h3>
        <p className="text-text-2">{score} / {questions.length} correct ({percent}%)</p>
        <button type="button" onClick={() => onComplete(score)} className="rounded-xl bg-accent-1 px-5 py-3 font-semibold text-white">Done</button>
      </div>
    )
  }

  const question = questions[index]
  const answer = async (userAnswer: string) => {
    if (checking) return
    setChecking(true)
    const correct = userAnswer.trim().toLocaleLowerCase() === question.vocab.english.trim().toLocaleLowerCase() || userAnswer.trim() === question.vocab.korean.trim()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        const existing = (await supabase.from('korean_progress').select('*').eq('user_id', user.id).eq('vocab_id', question.vocab.id).maybeSingle()).data as { mastery_level?: number; times_correct?: number; times_wrong?: number } | null
        const mastery = Math.max(0, Math.min(5, (existing?.mastery_level ?? 0) + (correct ? 1 : -1))) as KoreanProgress['masteryLevel']
        const next = new Date()
        next.setDate(next.getDate() + reviewDelayDays(mastery))
        await upsertProgress(user.id, question.vocab.id, {
          masteryLevel: mastery,
          timesCorrect: (existing?.times_correct ?? 0) + (correct ? 1 : 0),
          timesWrong: (existing?.times_wrong ?? 0) + (correct ? 0 : 1),
          lastReviewedAt: new Date().toISOString(),
          nextReviewAt: next.toISOString(),
        })
      } catch {
        // Quiz scoring remains available while the optional migration is unavailable.
      }
    }
    if (correct) setScore((current) => current + 1)
    if (index + 1 >= questions.length) setComplete(true)
    else setIndex((current) => current + 1)
    setChecking(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-text-2">
        <span>Question {index + 1} of {questions.length}</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={16} /> {score} correct</span>
      </div>
      <QuizQuestion question={question} onAnswer={answer} disabled={checking} />
    </div>
  )
}
