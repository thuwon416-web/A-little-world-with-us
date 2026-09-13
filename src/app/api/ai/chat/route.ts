import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { AIProviderError, generateAiResponse, isAiProvider } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage-log'
import { checkAiUsageLimit, checkRateLimit } from '@/lib/rate-limit'

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  provider: z.string().optional(),
})

const systemPrompt = 'You are a helpful relationship assistant for "A Little World With Us". Help with love advice, date ideas, and relationship tips. Be warm, supportive, romantic, and never judgmental. Reply in the same language as the user; use Myanmar language by default when the user does not clearly specify a language. Use MMK for monetary amounts.'

export async function POST(req: NextRequest) {
  let authenticatedUserId: string | undefined
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
    authenticatedUserId = user.id

    const rateLimitResult = await checkRateLimit(`ai-chat:${user.id}`, 10, 60_000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    const validated = chatSchema.parse(await req.json())
    const usageLimit = await checkAiUsageLimit(user.id, 75)
    if (!usageLimit.allowed) {
      return NextResponse.json(
        { error: 'Daily AI usage limit exceeded. Please try again tomorrow.', resetTime: usageLimit.resetTime },
        { status: 429 }
      )
    }
    const requestedProvider = validated.provider
    const provider = requestedProvider === undefined
      ? undefined
      : isAiProvider(requestedProvider)
        ? requestedProvider
        : null
    if (provider === null) {
      return NextResponse.json({ error: 'Unsupported AI provider' }, { status: 400 })
    }

    const result = await generateAiResponse({
      provider,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: validated.message },
      ],
      maxTokens: 500,
    })
    void logAiUsage({
      userId: user.id,
      endpoint: 'chat',
      provider: result.provider,
      status: 'success',
      promptLength: systemPrompt.length + validated.message.length,
      responseLength: result.content.length,
    })

    return NextResponse.json({ response: result.content, provider: result.provider })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    if (error instanceof AIProviderError) {
      if (authenticatedUserId) {
        void logAiUsage({
          userId: authenticatedUserId,
          endpoint: 'chat',
          provider: error.failures.at(-1)?.provider ?? 'unknown',
          status: error.failures.length > 0 && error.failures.every((failure) => failure.error === 'Request timed out')
            ? 'timeout'
            : 'failure',
          promptLength: 0,
          responseLength: 0,
        })
      }
      console.error('Chat AI providers exhausted:', error.failures.map(({ provider, error: reason }) => ({ provider, reason })))
      return NextResponse.json(
        { error: 'All available AI providers are temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      )
    }
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}
