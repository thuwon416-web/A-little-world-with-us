import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  AI_COMPLETION_BUDGET,
  optionalString,
  withAiRouteAuth,
} from '@/lib/ai/route-helpers'
import { AI_PROVIDER_PROFILES, generateAiResponse } from '@/lib/ai/providers'

// Validation schema
const messageSuggestionsSchema = z.object({
  context: optionalString(1000),
})

export async function POST(req: NextRequest) {
  try {
    return await withAiRouteAuth(async (req) => {

    // 3. Parse and validate request
    const body = await req.json()
    const validated = messageSuggestionsSchema.parse(body)

    const generated = await generateAiResponse({
      allowedProviders: AI_PROVIDER_PROFILES.relationshipWriting,
      maxTokens: AI_COMPLETION_BUDGET,
      messages: [
        { role: 'system', content: 'Generate 5 romantic message suggestions. Return JSON array of strings. Be sweet, thoughtful, and appropriate for the context. Return JSON only.' },
        { role: 'user', content: `Generate message suggestions for: ${validated.context || 'a loving couple'}` },
      ],
    })
    let suggestions: string[]
    try {
      suggestions = z.array(z.string()).parse(JSON.parse(generated.content))
    } catch (error) {
      console.error('Message suggestions AI response parsing failed:', error)
      return NextResponse.json({ error: 'AI service returned an invalid response.' }, { status: 502 })
    }

    return NextResponse.json({ suggestions })

    })(req)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Message Suggestions error')
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
