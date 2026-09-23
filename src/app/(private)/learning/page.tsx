'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, ChevronDown, ChevronUp, Languages, Volume2, X } from 'lucide-react'
import { KOREAN_LESSONS } from '@/data/korean-lessons'
import { KOREAN_VOCAB } from '@/data/korean-vocab'
import type { KoreanLevel, KoreanLesson, KoreanProgress, KoreanVocab } from '@/types/korean'
import { getProgress } from '@/services/korean'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/features/auth/ThemeProvider'
import { QuizEngine } from '@/features/learning/QuizEngine'
import { isTTSSupported, speakKorean, stopSpeaking } from '@/lib/tts'

const levels: KoreanLevel[] = [1, 2, 3, 4, 5, 6, 7]

export default function LearningPage() {
  const { mode } = useTheme()
  const [selectedLevel, setSelectedLevel] = useState<KoreanLevel>(1)
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [selectedVocab, setSelectedVocab] = useState<KoreanVocab | null>(null)
  const [progress, setProgress] = useState<KoreanProgress[]>([])
  const [quizLevel, setQuizLevel] = useState<KoreanLevel | null>(null)
  const [ttsSupported, setTtsSupported] = useState(false)
  const [speakingVocabId, setSpeakingVocabId] = useState<string | null>(null)

  useEffect(() => {
    setTtsSupported(isTTSSupported())
    return () => stopSpeaking()
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      try {
        const records = await getProgress(user.id)
        if (active) setProgress(records)
      } catch {
        // Progress is optional while the Korean migration is being deployed.
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const lessons = useMemo(
    () => KOREAN_LESSONS.filter((lesson) => lesson.level === selectedLevel),
    [selectedLevel]
  )
  const levelVocab = useMemo(
    () => KOREAN_VOCAB.filter((vocab) => vocab.level === selectedLevel),
    [selectedLevel]
  )
  const masteredIds = useMemo(
    () => new Set(progress.filter((item) => item.masteryLevel >= 5).map((item) => item.vocabId)),
    [progress]
  )

  const getLessonVocab = (lesson: KoreanLesson) =>
    KOREAN_VOCAB.filter((vocab) => vocab.lessonId === lesson.id)

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 animate-fade-in" data-theme={mode}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-btn bg-accent-1/15 text-accent-1">
              <Languages size={26} aria-hidden="true" />
            </div>
            <div>
              <h1
                className="text-4xl text-text-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Korean Tutor
              </h1>
              <p className="mt-1 text-sm text-text-2">
                Learn Korean together, one step at a time.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-btn border border-accent-1/20 bg-card px-4 py-3 text-right">
          <p className="text-xs text-text-2">Your progress</p>
          <p className="mt-1 text-lg font-semibold text-text-1">
            {masteredIds.size} / {KOREAN_VOCAB.length} words mastered
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-soft-tint"
            role="progressbar"
            aria-label="Korean vocabulary mastered"
            aria-valuemin={0}
            aria-valuemax={KOREAN_VOCAB.length}
            aria-valuenow={masteredIds.size}
          >
            <div
              className="h-full rounded-full bg-accent-1 transition-[width] duration-300"
              style={{ width: `${KOREAN_VOCAB.length ? (masteredIds.size / KOREAN_VOCAB.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Korean levels">
        {levels.map((level) => {
          return (
            <button
              key={level}
              type="button"
              role="tab"
              onClick={() => {
                setSelectedLevel(level)
                setOpenLessonId(null)
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-left transition ${
                selectedLevel === level
                  ? 'border-accent-1 bg-accent-1 text-white'
                  : 'border-accent-1/20 bg-card text-text-2 hover:bg-accent-1/10'
              }`}
              aria-selected={selectedLevel === level}
            >
              <span className="block text-xs uppercase tracking-wider">Level {level}</span>
            </button>
          )
        })}
      </nav>

      <section className="space-y-4" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-text-1">
              <BookOpen className="h-6 w-6 text-accent-1" aria-hidden="true" />
              Level {selectedLevel}
            </h2>
            <p className="mt-1 text-sm text-text-2">
              {levelVocab.length} words and phrases to explore
            </p>
          </div>
          {levelVocab.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-2">
                {levelVocab.filter((vocab) => masteredIds.has(vocab.id)).length} mastered
              </span>
              <button
                type="button"
                onClick={() => setQuizLevel(selectedLevel)}
                className="rounded-xl bg-accent-1 px-4 py-2 text-sm font-semibold text-white"
              >
                Start Quiz
              </button>
            </div>
          )}
        </div>

        {lessons.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {lessons.map((lesson) => {
              const lessonVocab = getLessonVocab(lesson)
              const isOpen = openLessonId === lesson.id
              const mastered = lessonVocab.filter((vocab) => masteredIds.has(vocab.id)).length

              return (
                <article
                  key={lesson.id}
                  className="overflow-hidden rounded-panel border border-accent-1/20 bg-card shadow-lg backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => setOpenLessonId(isOpen ? null : lesson.id)}
                    className="w-full p-5 text-left transition hover:bg-accent-1/5"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-accent-1">
                          Lesson {lesson.order}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-text-1">
                          {lesson.title}
                        </h3>
                        <p className="mt-1 text-sm text-accent-1">{lesson.titleMy}</p>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="mt-1 shrink-0 text-accent-1" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="mt-1 shrink-0 text-accent-1" aria-hidden="true" />
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-text-2">
                      {lesson.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-text-2">
                      <span>{lessonVocab.length} vocabulary items</span>
                      <span>{mastered} mastered</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-accent-1/15 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {lessonVocab.map((vocab) => (
                          <button
                            key={vocab.id}
                            type="button"
                            onClick={() => setSelectedVocab(vocab)}
                            className="rounded-btn border border-accent-1/15 bg-card p-4 text-left transition hover:border-accent-1/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-2xl font-semibold text-text-1">
                                {vocab.korean}
                              </span>
                              {masteredIds.has(vocab.id) && (
                                <Check className="h-5 w-5 text-success" aria-label="Mastered" />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-accent-1">{vocab.romanization}</p>
                            <p className="mt-2 text-sm text-text-1">{vocab.english}</p>
                            <p className="mt-1 text-sm text-text-2">{vocab.myanmar}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-panel border border-dashed border-accent-1/25 bg-card p-10 text-center">
            <p className="font-medium text-text-1">This level is coming soon.</p>
            <p className="mt-2 text-sm text-text-2">
              We are preparing more Korean lessons for you to enjoy together.
            </p>
          </div>
        )}
      </section>

      {quizLevel !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-panel border border-accent-1/20 bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-accent-1">Level {quizLevel}</p>
                <h2 className="text-2xl font-bold text-text-1">Korean Quiz</h2>
              </div>
              <button type="button" onClick={() => setQuizLevel(null)} className="rounded-lg px-3 py-2 text-sm text-text-2 hover:bg-accent-1/10">
                Close
              </button>
            </div>
            <QuizEngine level={quizLevel} quizType="multiple_choice" questionCount={Math.min(10, KOREAN_VOCAB.filter((item) => item.level === quizLevel).length)} onComplete={() => setQuizLevel(null)} />
          </div>
        </div>
      )}

      {selectedVocab && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onClick={() => setSelectedVocab(null)}
        >
          <section
            className="relative w-full max-w-lg rounded-panel border border-accent-1/25 bg-card p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vocab-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedVocab(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-text-2 hover:bg-accent-1/10 hover:text-text-1"
              aria-label="Close vocabulary details"
            >
              <X size={18} />
            </button>
            <p className="text-sm text-accent-1">{selectedVocab.romanization}</p>
            <h2 id="vocab-title" className="mt-2 text-5xl font-semibold text-text-1">
              {selectedVocab.korean}
            </h2>
            <p className="mt-4 text-xl text-text-1">{selectedVocab.english}</p>
            <p className="mt-1 text-lg text-text-2">{selectedVocab.myanmar}</p>
            {selectedVocab.exampleSentence && (
              <div className="mt-6 rounded-btn bg-soft-tint p-4">
                <p className="text-sm font-medium text-text-1">
                  {selectedVocab.exampleSentence}
                </p>
                {selectedVocab.exampleTranslation && (
                  <p className="mt-2 text-sm text-text-2">
                    {selectedVocab.exampleTranslation}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              disabled={!ttsSupported}
              onClick={() => {
                speakKorean(selectedVocab.korean)
                setSpeakingVocabId(selectedVocab.id)
                window.speechSynthesis?.addEventListener('end', () => setSpeakingVocabId(null), { once: true })
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-accent-1/20 px-4 py-3 text-sm text-text-2 disabled:cursor-not-allowed disabled:opacity-60"
              title={ttsSupported ? 'Play Korean pronunciation' : 'Speech synthesis is not supported'}
            >
              <Volume2 size={18} aria-hidden="true" />
              {speakingVocabId === selectedVocab.id ? 'Speaking...' : 'Listen'}
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
