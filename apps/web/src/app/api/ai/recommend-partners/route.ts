import { type NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest } from '@/lib/csrf'
import { z } from 'zod'
import {
  AI_COMPLETION_BUDGET,
  withAiRouteAuth,
} from '@/lib/ai/route-helpers'
import { AI_PROVIDER_PROFILES, generateAiResponse } from '@/lib/ai/providers'

// Validation schema
const recommendPartnersSchema = z.object({
  preferences: z.record(z.string().max(50), z.string().max(200)).refine((value) => Object.keys(value).length <= 20).optional(),
})

const generatedRecommendationsSchema = z.array(z.object({
  category: z.string(),
  name: z.string(),
  description: z.string(),
  reason: z.string(),
}))

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    return await withAiRouteAuth(async (req) => {

    // 3. Parse and validate request
    const body = await req.json()
    const validated = recommendPartnersSchema.parse(body)

    // Use AI API for relationship activity recommendations
    const generated = await generateAiResponse({
      allowedProviders: AI_PROVIDER_PROFILES.relationshipWriting,
      maxTokens: AI_COMPLETION_BUDGET,
      messages: [
        { role: 'system', content: 'You are a relationship activity recommender for couples. Recommend 3-5 couple activities based on preferences. Return JSON array with category, name, description, reason. Keep it romantic and practical. Return JSON only.' },
        { role: 'user', content: `Recommend couple activities for: ${JSON.stringify(validated.preferences || {})}` },
      ],
    })
    let recommendations: z.infer<typeof generatedRecommendationsSchema>
    try {
      recommendations = generatedRecommendationsSchema.parse(JSON.parse(generated.content))
    } catch (error) {
      console.error('AI recommendations response parsing failed:', error)
      return NextResponse.json({ error: 'AI service returned an invalid response.' }, { status: 502 })
    }

    return NextResponse.json({ recommendations })

    })(req)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('AI Recommendations error')
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
