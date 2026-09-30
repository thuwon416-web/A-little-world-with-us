import { supabase } from '@/lib/supabase'
import type { KoreanLevel, KoreanQuizQuestion, QuizType } from '@/types/korean'

type GeneratedQuizResponse = {
  questions: KoreanQuizQuestion[]
  source: 'ai' | 'static'
  provider?: string
}

export async function generateQuizWithAI(params: {
  level: KoreanLevel
  topic?: string
  questionCount: number
  questionTypes: QuizType[]
  language: 'en' | 'my'
}): Promise<KoreanQuizQuestion[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch('/api/ai/korean-quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? 'Unable to generate Korean quiz')
  }
  const result = await response.json() as GeneratedQuizResponse
  return result.questions
}
