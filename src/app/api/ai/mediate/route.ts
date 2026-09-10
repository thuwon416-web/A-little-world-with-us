import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { generateAiResponse } from '@/lib/ai/providers'
import { createRequestServerClient } from '@/lib/ai/request-client'
import { resolveCoupleRole } from '@/lib/ai/role-resolver'
import { assessAdviceSafety, safetySystemInstruction } from '@/lib/ai/safety'
import { HIM_PERSONA } from '@/features/ai-guardian/personas/him-persona'
import { HER_PERSONA } from '@/features/ai-guardian/personas/her-persona'
import { checkDailyRateLimit } from '@/lib/rate-limit'
import { decryptChatMessageServer } from '@/lib/chatEncryptionServer'

const requestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.enum(['my', 'en']).optional().default('my'),
})

const privacyColumns = 'allow_ai_read_chat,allow_ai_read_mood'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRequestServerClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const input = requestSchema.parse(await request.json())
    const rateLimit = await checkDailyRateLimit(user.id, 75)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Mediator rate limit exceeded. Try again later.' }, { status: 429 })
    }

    const resolved = await resolveCoupleRole(supabase, user.id)
    if (!resolved) {
      return NextResponse.json({ error: 'Accept a couple link before using the mediator.' }, { status: 403 })
    }

    const { data: privacy, error: privacyError } = await supabase
      .from('ai_privacy_settings')
      .select(privacyColumns)
      .eq('user_id', user.id)
      .maybeSingle()
    if (privacyError) {
      console.error('Mediator privacy lookup failed:', privacyError)
      return NextResponse.json({ error: 'Could not load AI privacy settings.' }, { status: 503 })
    }

    const contextEnabled = Boolean(privacy?.allow_ai_read_chat || privacy?.allow_ai_read_mood)
    let contextHint = 'No private relationship context was shared with the mediator.'
    if (contextEnabled) {
      const categories = [
        ...(privacy?.allow_ai_read_mood ? ['mood', 'conflict'] : []),
        ...(privacy?.allow_ai_read_chat ? ['affection', 'conflict'] : []),
      ]
      const { data: contextRows } = await supabase
        .from('ai_context_memory')
        .select('couple_id,category,context_text')
        .eq('user_id', user.id)
        .in('category', categories.length ? [...new Set(categories)] : ['__none__'])
        .gte('expires_at', new Date().toISOString())
        .is('processed_at', null)
        .order('created_at', { ascending: false })
        .limit(8)
      const decrypted = await Promise.all((contextRows ?? []).map(async (row) => {
        try {
          return `${row.category}: ${await decryptChatMessageServer(row.context_text, row.couple_id)}`
        } catch {
          return null
        }
      }))
      const usable = decrypted.filter((value): value is string => Boolean(value))
      if (usable.length) contextHint = usable.join('\n')
    }

    const safety = assessAdviceSafety(input.message)
    const persona = resolved.role === 'him' ? HIM_PERSONA : HER_PERSONA
    const language = input.language === 'en'
      ? 'Respond in English.'
      : 'Respond in Myanmar language by default, while keeping key consent and safety terms clear.'
    const generated = safety.message ? null : await generateAiResponse({
      maxTokens: 650,
      messages: [
        { role: 'system', content: `${persona} ${safetySystemInstruction('mediator')} ${language}` },
        { role: 'system', content: `Only use this permitted, short-lived context: ${contextHint}` },
        { role: 'user', content: input.message },
      ],
    })
    const finalResponse = safety.message ?? generated?.content
    if (!finalResponse) {
      return NextResponse.json({ error: 'Mediator is unavailable.' }, { status: 503 })
    }

    const { error: historyError } = await supabase.from('ai_advice_history').insert({
      couple_id: resolved.coupleId,
      user_id: user.id,
      advice_type: 'mediator',
      context_data: {
        language: input.language,
        safetyLevel: safety.level,
        permittedScopes: ['mood', 'chat'],
      },
      ai_response: finalResponse,
    })
    if (historyError) {
      console.error('Mediator advice history insert failed:', historyError)
      return NextResponse.json({ error: 'Could not save mediator advice.' }, { status: 503 })
    }

    return NextResponse.json({ response: finalResponse })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Mediator API error:', error)
    return NextResponse.json({ error: 'Mediator is unavailable.' }, { status: 503 })
  }
}
