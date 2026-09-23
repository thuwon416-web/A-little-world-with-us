import { CheckCircle2, Trophy } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { QuizQuestion, type MobileQuizPrompt } from './QuizQuestion'

import { useTheme } from '@/context/ThemeContext'
import { KOREAN_VOCAB } from '@/data/korean-vocab'
import { useAuth } from '@/lib/auth'
import { getProgress, upsertProgress } from '@/services/korean'
import type { KoreanLevel, KoreanProgress, KoreanVocab, QuizType } from '@/types/korean'

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)
const delayDays = (mastery: KoreanProgress['masteryLevel']) =>
  mastery <= 1 ? 1 : mastery <= 3 ? 3 : mastery === 4 ? 7 : 30

function makePrompt(vocab: KoreanVocab, type: QuizType, pool: KoreanVocab[]): MobileQuizPrompt {
  const answer = type === 'typing' ? vocab.korean : vocab.english
  const distractors = shuffle(pool.filter((item) => item.id !== vocab.id))
    .slice(0, 3)
    .map((item) => item.english)
  return {
    vocab,
    questionType: type,
    options: shuffle([answer, ...distractors]),
    prompt:
      type === 'typing'
        ? `Type the Korean word for "${vocab.english}".`
        : `What does "${vocab.korean}" mean?`,
  }
}

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
  const { colors } = useTheme()
  const { user } = useAuth()
  const pool = useMemo(() => KOREAN_VOCAB.filter((item) => item.level === level), [level])
  const questions = useMemo(
    () =>
      shuffle(pool)
        .slice(0, questionCount)
        .map((item) => makePrompt(item, quizType, pool)),
    [pool, questionCount, quizType]
  )
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [complete, setComplete] = useState(false)
  const [checking, setChecking] = useState(false)

  if (!questions.length)
    return (
      <Text style={{ color: colors.textSecondary }}>
        No vocabulary is available for this level yet.
      </Text>
    )
  if (complete) {
    return (
      <View style={{ alignItems: 'center', gap: 14 }}>
        <Trophy size={44} color={colors.accent1} />
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '700' }}>
          Quiz complete
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          {score} / {questions.length} correct
        </Text>
        <TouchableOpacity
          onPress={() => onComplete(score)}
          style={{ backgroundColor: colors.accent1, borderRadius: 12, padding: 14 }}
        >
          <Text style={{ color: colors.background, fontWeight: '700' }}>Done</Text>
        </TouchableOpacity>
      </View>
    )
  }
  const question = questions[index]
  const answer = async (userAnswer: string) => {
    if (checking) return
    setChecking(true)
    const correct =
      userAnswer.trim().toLocaleLowerCase() === question.vocab.english.trim().toLocaleLowerCase() ||
      userAnswer.trim() === question.vocab.korean.trim()
    if (user) {
      try {
        const existing = (await getProgress(user.id)).find(
          (item) => item.vocabId === question.vocab.id
        )
        const mastery = Math.max(
          0,
          Math.min(5, (existing?.masteryLevel ?? 0) + (correct ? 1 : -1))
        ) as KoreanProgress['masteryLevel']
        const next = new Date()
        next.setDate(next.getDate() + delayDays(mastery))
        await upsertProgress(user.id, question.vocab.id, {
          masteryLevel: mastery,
          timesCorrect: (existing?.timesCorrect ?? 0) + (correct ? 1 : 0),
          timesWrong: (existing?.timesWrong ?? 0) + (correct ? 0 : 1),
          lastReviewedAt: new Date().toISOString(),
          nextReviewAt: next.toISOString(),
        })
      } catch {
        // Keep local quiz scoring available while the migration is unavailable.
      }
    }
    const nextScore = score + (correct ? 1 : 0)
    setScore(nextScore)
    if (index + 1 >= questions.length) setComplete(true)
    else setIndex((current) => current + 1)
    setChecking(false)
  }
  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.textSecondary }}>
          Question {index + 1} of {questions.length}
        </Text>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={{ color: colors.textSecondary }}>{score} correct</Text>
        </View>
      </View>
      <QuizQuestion question={question} onAnswer={answer} disabled={checking} colors={colors} />
    </View>
  )
}
