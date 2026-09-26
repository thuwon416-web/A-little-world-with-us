import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { AIProviderError, generateAiResponse } from '@/lib/ai/providers'
import { logAiUsage } from '@/lib/ai/usage-log'
import { checkAiUsageLimit, checkRateLimit } from '@/lib/rate-limit'

const journalReflectSchema = z.object({
  journal_id: z.string().min(1),
})

export async function POST(req: NextRequest) {
  let authenticatedUserId: string | undefined
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => undefined } }
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

    const rateLimit = await checkRateLimit(`ai-journal-reflect:${user.id}`, 10, 60_000)
    if (!rateLimit.allowed) return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    const usageLimit = await checkAiUsageLimit(user.id, 75)
    if (!usageLimit.allowed) {
      return NextResponse.json(
        { error: 'Daily AI usage limit exceeded. Please try again tomorrow.', resetTime: usageLimit.resetTime },
        { status: 429 }
      )
    }

    const { journal_id: journalId } = journalReflectSchema.parse(await req.json())
    const { data: entry, error: entryError } = await supabase
      .from('memories')
      .select('id,couple_id,user_id,title,description,metadata,category')
      .eq('id', journalId)
      .maybeSingle()
    if (entryError) throw entryError
    if (!entry) return NextResponse.json({ error: 'Journal entry not found.' }, { status: 404 })
    if (entry.user_id !== user.id) return NextResponse.json({ error: 'You can only reflect on your own journal entries.' }, { status: 403 })
    if (entry.category !== 'journal') return NextResponse.json({ error: 'This memory is not a journal entry.' }, { status: 400 })

    const { data: privacy, error: privacyError } = await supabase
      .from('ai_privacy_settings')
      .select('allow_ai_read_memories')
      .eq('user_id', user.id)
      .maybeSingle()
    if (privacyError) throw privacyError
    if (!privacy?.allow_ai_read_memories) {
      return NextResponse.json({ error: 'Enable AI memory access in privacy settings first.' }, { status: 403 })
    }

    const systemPrompt = 'You are a gentle, caring partner. Reflect briefly on this personal journal entry with empathy. 2-4 sentences. No advice unless asked. No medical or clinical language.'
    const userPrompt = `Title: ${entry.title}\n\n${entry.description ?? ''}\n\nMood: ${(entry.metadata as { mood_tag?: string } | null)?.mood_tag ?? 'unspecified'}`
    const result = await generateAiResponse({
      allowedProviders: ['groq', 'gemini', 'cerebras'],
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 240,
    })
    const metadata = {
      ...((entry.metadata as Record<string, unknown> | null) ?? {}),
      ai_reflection: result.content,
    }
    const { error: updateError } = await supabase
      .from('memories')
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq('id', journalId)
      .select()
      .single()
    if (updateError) throw updateError

    void logAiUsage({
      userId: user.id,
      coupleId: entry.couple_id,
      endpoint: 'journal-reflect',
      provider: result.provider,
      status: 'success',
      promptLength: systemPrompt.length + userPrompt.length,
      responseLength: result.content.length,
    })
    return NextResponse.json({ reflection: result.content })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    if (error instanceof AIProviderError) {
      if (authenticatedUserId) {
        void logAiUsage({
          userId: authenticatedUserId,
          endpoint: 'journal-reflect',
          provider: error.failures.at(-1)?.provider ?? 'unknown',
          status: error.failures.every((failure) => failure.error === 'Request timed out') ? 'timeout' : 'failure',
          promptLength: 0,
          responseLength: 0,
        })
      }
      console.error('Journal reflection providers exhausted:', error.failures.map(({ provider, error: reason }) => ({ provider, reason })))
      return NextResponse.json({ error: 'AI providers are temporarily unavailable. Please try again shortly.' }, { status: 503 })
    }
    console.error('Journal reflection API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI reflection is unavailable.' }, { status: 500 })
  }
}
