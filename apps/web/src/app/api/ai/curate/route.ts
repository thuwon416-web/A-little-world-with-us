import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { generateAiResponse } from '@/lib/ai/providers'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  assertAiScope,
  PrivacyDeniedError,
  PrivacySettingsUnavailableError,
} from '@/lib/ai/privacy-guard'

const schema = z.object({ memoryIds: z.array(z.string().uuid()).min(1).max(20), theme: z.string().min(1).max(80), context: z.string().max(500).optional() })

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertAiScope(user.id, 'memories')
    const input = schema.parse(await request.json())
    const limit = await checkRateLimit(`ai-curate:${user.id}`, 5, 60_000)
    if (!limit.allowed) return NextResponse.json({ error: 'Please wait before generating another story.' }, { status: 429 })
    const { data: memories, error } = await supabase.from('memories').select('title,caption,description,date,category').in('id', input.memoryIds).order('date', { ascending: true })
    if (error) throw error
    if (!memories?.length) return NextResponse.json({ error: 'Select memories from your shared collection first.' }, { status: 400 })
    const selected = memories.map((memory) => `- ${memory.date}: ${memory.title ?? memory.caption ?? 'Untitled'} (${memory.category})${memory.description ? ` — ${memory.description}` : ''}`).join('\n')
    const generated = await generateAiResponse({ maxTokens: 650, messages: [
      { role: 'system', content: 'Write a warm, concise relationship memory story. Use only the user-selected memory details. Do not invent facts, medical advice, or private details.' },
      { role: 'user', content: `Theme: ${input.theme}\nOptional context: ${input.context ?? 'none'}\nSelected memories:\n${selected}` },
    ], allowedProviders: ['groq', 'gemini', 'cerebras'] })
    return NextResponse.json({ story: generated.content, provider: generated.provider })
  } catch (error) {
    if (error instanceof PrivacyDeniedError) {
      return NextResponse.json(
        { error: 'Enable AI memory access in privacy settings to curate memories.' },
        { status: 403 }
      )
    }
    if (error instanceof PrivacySettingsUnavailableError) {
      console.error('AI curation privacy lookup failed:', error)
      return NextResponse.json({ error: 'Could not load AI privacy settings.' }, { status: 503 })
    }
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid curation request.' }, { status: 400 })
    console.error('AI curation error:', error)
    return NextResponse.json({ error: 'AI curation is unavailable.' }, { status: 503 })
  }
}
