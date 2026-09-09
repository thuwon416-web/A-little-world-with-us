import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { generateAiResponse } from '@/lib/ai/providers'
import { checkRateLimit } from '@/lib/rate-limit'

const inputSchema = z.object({
  occasion: z.string().trim().min(1).max(80),
  interests: z.string().trim().min(1).max(500),
  budget: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const limit = await checkRateLimit(`ai-surprise:${user.id}`, 5, 60_000)
    if (!limit.allowed) return NextResponse.json({ error: 'Please wait before generating more ideas.' }, { status: 429 })

    const input = inputSchema.parse(await request.json())
    const generated = await generateAiResponse({
      maxTokens: 550,
      messages: [
        { role: 'system', content: 'Suggest thoughtful, realistic surprise ideas for a couple. Use only the details supplied by the user. Return five concise options with a title, why it fits, approximate cost, and one first step. Never claim to know private facts.' },
        { role: 'user', content: `Occasion: ${input.occasion}\nInterests: ${input.interests}\nBudget: ${input.budget || 'not specified'}\nOptional notes: ${input.notes || 'none'}` },
      ],
    })
    return NextResponse.json({ ideas: generated.content, provider: generated.provider })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Please provide an occasion and at least one interest.' }, { status: 400 })
    console.error('AI surprise error:', error)
    return NextResponse.json({ error: 'AI surprise ideas are unavailable.' }, { status: 503 })
  }
}
