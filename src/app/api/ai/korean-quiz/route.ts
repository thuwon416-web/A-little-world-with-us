import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { KOREAN_VOCAB } from '@/data/korean-vocab'
import { AIProviderError, generateAiResponse } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage-log'
import { checkAiUsageLimit, checkRateLimit } from '@/lib/rate-limit'

const quizTypes = ['multiple_choice', 'fill_blank', 'matching', 'listening', 'typing'] as const
const requestSchema = z.object({
  level: z.number().int().min(1).max(7),
  topic: z.string().trim().min(1).max(80).optional(),
  questionCount: z.number().int().min(1).max(20),
  questionTypes: z.array(z.enum(quizTypes)).min(1).max(5).default([...quizTypes]),
  language: z.enum(['en', 'my']),
})

const generatedQuestionSchema = z.object({
  questionText: z.string().min(1),
  questionType: z.enum(quizTypes),
  options: z.array(z.string()).min(2).max(4).nullable(),
  correctAnswer: z.string().min(1),
  korean: z.string().min(1),
  romanization: z.string().min(1),
  english: z.string().min(1),
  myanmar: z.string().min(1),
})
const generatedResponseSchema = z.object({ questions: z.array(generatedQuestionSchema) })

type QuizRequest = z.infer<typeof requestSchema>

function buildPrompt(input: QuizRequest): string {
  return `Generate ${input.questionCount} Korean quiz questions for Level ${input.level}.
Topic: ${input.topic ?? 'general'}
Types: ${input.questionTypes.join(', ')}
Language: ${input.language}

Return only valid JSON:
{
  "questions": [
    {
      "questionText": "...",
      "questionType": "multiple_choice",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "korean": "...",
      "romanization": "...",
      "english": "...",
      "myanmar": "..."
    }
  ]
}

Use only the requested question types. For fill_blank, listening, and typing, options may be null. For multiple_choice and matching, provide four options. Keep Korean and Myanmar natural and suitable for a learner.`
}

function parseGeneratedJson(content: string) {
  const jsonText = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return generatedResponseSchema.parse(JSON.parse(jsonText))
}

function fallbackQuestions(input: QuizRequest) {
  const vocab = KOREAN_VOCAB.filter((item) => item.level === input.level)
  const selected = [...vocab].sort(() => Math.random() - 0.5).slice(0, input.questionCount)
  return selected.map((item, index) => {
    const questionType = input.questionTypes[index % input.questionTypes.length]
    const distractors = vocab
      .filter((candidate) => candidate.id !== item.id)
      .slice(0, 3)
      .map((candidate) => candidate.english)
    const options = questionType === 'multiple_choice' || questionType === 'matching'
      ? [item.english, ...distractors]
      : null
    return {
      id: `ai-fallback-${item.id}-${index}`,
      sessionId: '',
      vocabId: item.id,
      questionType,
      questionText: questionType === 'typing'
        ? `Type the Korean word for "${item.english}".`
        : `What does "${item.korean}" mean?`,
      options,
      correctAnswer: questionType === 'typing' ? item.korean : item.english,
      userAnswer: null,
      isCorrect: null,
      answeredAt: null,
      createdAt: new Date().toISOString(),
      korean: item.korean,
      romanization: item.romanization,
      english: item.english,
      myanmar: item.myanmar,
    }
  })
}

export async function POST(req: NextRequest) {
  let promptLength = 0
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user: cookieUser } } = await supabase.auth.getUser()
    const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const tokenClient = bearer
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      : null
    const { data: { user: tokenUser } } = tokenClient && bearer
      ? await tokenClient.auth.getUser(bearer)
      : { data: { user: null } }
    const user = cookieUser ?? tokenUser
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rateLimit = await checkRateLimit(`ai-korean-quiz:${user.id}`, 10, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }
    const usageLimit = await checkAiUsageLimit(user.id, 75)
    if (!usageLimit.allowed) {
      return NextResponse.json(
        { error: 'Daily AI usage limit exceeded. Please try again tomorrow.', resetTime: usageLimit.resetTime },
        { status: 429 }
      )
    }

    const input = requestSchema.parse(await req.json())
    const prompt = buildPrompt(input)
    promptLength = prompt.length
    try {
      const result = await generateAiResponse({
        messages: [
          { role: 'system', content: 'You create accurate, encouraging Korean language exercises. Return JSON only.' },
          { role: 'user', content: prompt },
        ],
        maxTokens: Math.min(2400, 120 * input.questionCount),
      })
      const generated = parseGeneratedJson(result.content)
      const questions = generated.questions.slice(0, input.questionCount).map((question, index) => ({
        ...question,
        id: `ai-${Date.now()}-${index}`,
        sessionId: '',
        vocabId: '',
        userAnswer: null,
        isCorrect: null,
        answeredAt: null,
        createdAt: new Date().toISOString(),
      }))
      if (questions.length === 0) throw new Error('AI returned no quiz questions')
      void logAiUsage({
        userId: user.id,
        endpoint: 'korean-quiz',
        provider: result.provider,
        status: 'success',
        promptLength,
        responseLength: result.content.length,
      })
      return NextResponse.json({ questions, source: 'ai', provider: result.provider })
    } catch (error) {
      const provider = error instanceof AIProviderError ? error.failures.at(-1)?.provider ?? 'unknown' : 'unknown'
      void logAiUsage({
        userId: user.id,
        endpoint: 'korean-quiz',
        provider,
        status: error instanceof AIProviderError && error.failures.every((failure) => failure.error === 'Request timed out')
          ? 'timeout'
          : 'failure',
        promptLength,
        responseLength: 0,
      })
      console.error('Korean quiz AI failed; using static fallback:', error)
      return NextResponse.json({ questions: fallbackQuestions(input), source: 'static' })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Korean quiz API error:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}
