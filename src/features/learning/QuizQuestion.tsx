'use client'

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { isTTSSupported, speakKorean } from '@/lib/tts'
import type { KoreanVocab, QuizType } from '@/types/korean'

export type QuizPrompt = {
  vocab: KoreanVocab
  questionType: QuizType
  options: string[]
  prompt: string
}

export function QuizQuestion({
  question,
  onAnswer,
  disabled,
}: {
  question: QuizPrompt
  onAnswer: (answer: string) => void
  disabled: boolean
}) {
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [ttsSupported] = useState(isTTSSupported)
  const needsInput = question.questionType === 'fill_blank' || question.questionType === 'typing'
  const submit = () => {
    const answer = needsInput ? value.trim() : selected
    if (answer) onAnswer(answer)
  }

  return (
    <div className="space-y-5">
      <p className="text-lg font-semibold text-text-1">{question.prompt}</p>
      {question.questionType === 'listening' && (
        <button
          type="button"
          disabled={!ttsSupported}
          onClick={() => speakKorean(question.vocab.korean)}
          className="flex items-center gap-2 rounded-xl border border-accent-1/20 px-4 py-3 text-sm text-text-2 opacity-70"
        >
          <Volume2 size={18} /> Listen
        </button>
      )}
      {needsInput ? (
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit()
          }}
          placeholder={question.questionType === 'typing' ? 'Type Korean or romanization' : 'Type your answer'}
          className="w-full rounded-xl border border-accent-1/20 bg-card px-4 py-3 text-text-1 outline-none focus:border-accent-1"
          disabled={disabled}
          autoFocus
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(option)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                selected === option
                  ? 'border-accent-1 bg-accent-1/15 text-text-1'
                  : 'border-accent-1/20 text-text-2 hover:bg-accent-1/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={disabled || (!value.trim() && !selected)}
        onClick={submit}
        className="rounded-xl bg-accent-1 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        Check answer
      </button>
    </div>
  )
}
