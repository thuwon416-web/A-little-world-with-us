import { type NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest } from '@/lib/csrf'
import { z } from 'zod'
import { logAiUsage } from '@/lib/ai/usage-log'
import { AI_PROVIDER_PROFILES, generateAiResponse } from '@/lib/ai/providers'
import {
  AI_COMPLETION_BUDGET,
  optionalString,
  withAiRouteAuth,
} from '@/lib/ai/route-helpers'

// Validation schema
const loveLetterSchema = z.object({
  partnerName: optionalString(200),
  relationshipLength: optionalString(100),
  specialMemories: optionalString(1000),
  tone: optionalString(100),
})

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    return await withAiRouteAuth(async (req, { userId }) => {

    // 3. Parse and validate request
    const body = await req.json()
    const validated = loveLetterSchema.parse(body)
    // The user supplied these details directly; privacy scopes govern stored context, not explicit prompts.

    const generated = await generateAiResponse({
      allowedProviders: AI_PROVIDER_PROFILES.relationshipWriting,
      maxTokens: AI_COMPLETION_BUDGET,
      messages: [
        { role: 'system', content: 'Write a heartfelt love letter. Return as plain text. Be romantic, sincere, and personal.' },
        { role: 'user', content: `Write a love letter to ${validated.partnerName || 'My Love'}. Relationship: ${validated.relationshipLength || 'not specified'}. Memories: ${validated.specialMemories || 'none provided'}. Tone: ${validated.tone || 'warm and sincere'}` },
      ],
    })
    const loveLetter = generated.content

    void logAiUsage({
      userId,
      endpoint: 'love-letter',
      provider: generated.provider,
      status: 'success',
      promptLength: (validated.partnerName?.length ?? 0) + (validated.relationshipLength?.length ?? 0) + (validated.specialMemories?.length ?? 0) + (validated.tone?.length ?? 0),
      responseLength: loveLetter.length,
    })

    return NextResponse.json({ loveLetter })

    })(req)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Love Letter error')
    return NextResponse.json({ error: 'Failed to generate love letter' }, { status: 500 })
  }
}
